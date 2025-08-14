// services/payout.service.js
import { Payout, Transaction, PaymentAccount, User } from '../models/index.js';
import { stripeService, paypalService } from './index.js';
import { TRANSACTION_STATUS, ACCOUNT_STATUS } from '../utils/enums.js';
import { constants } from '../utils/index.js';
import { logger } from '../utils/index.js';

class PayoutService {

  // ============= PAYOUT CALCULATION =============

  async calculatePendingPayouts(landlord_id = null) {
    const filter = {
      transaction_type: 'rent_payment',
      status: TRANSACTION_STATUS.COMPLETED,
      escrow_released: true,
      payout_processed: { $ne: true }
    };

    if (landlord_id) {
      filter.payee_id = landlord_id;
    }

    // Get completed rent payments ready for payout
    const transactions = await Transaction.find(filter)
      .populate('payee_id', 'first_name last_name email')
      .populate('payer_id', 'first_name last_name email');

    // Group by landlord
    const landlordPayouts = {};

    for (const transaction of transactions) {
      const landlordId = transaction.payee_id._id.toString();
      
      if (!landlordPayouts[landlordId]) {
        landlordPayouts[landlordId] = {
          landlord: transaction.payee_id,
          transactions: [],
          total_gross: 0,
          total_platform_fee: 0,
          total_gateway_fee: 0,
          total_net: 0
        };
      }

      landlordPayouts[landlordId].transactions.push(transaction);
      landlordPayouts[landlordId].total_gross += transaction.amount;
      landlordPayouts[landlordId].total_platform_fee += transaction.platform_fee;
      landlordPayouts[landlordId].total_gateway_fee += transaction.gateway_fee;
      landlordPayouts[landlordId].total_net += transaction.net_amount;
    }

    return Object.values(landlordPayouts);
  }

  // ============= PAYOUT PROCESSING =============

  async processPendingPayouts() {
    logger.info('Starting payout processing job');

    try {
      const pendingPayouts = await this.calculatePendingPayouts();
      
      if (pendingPayouts.length === 0) {
        logger.info('No pending payouts found');
        return { processed: 0, failed: 0 };
      }

      let processed = 0;
      let failed = 0;

      for (const payoutData of pendingPayouts) {
        try {
          // Check if landlord has active payment account
          const paymentAccount = await PaymentAccount.findOne({
            user_id: payoutData.landlord._id,
            account_status: ACCOUNT_STATUS.ACTIVE,
            payout_enabled: true
          });

          if (!paymentAccount) {
            logger.warn('Landlord payment account not ready for payout', {
              landlordId: payoutData.landlord._id,
              email: payoutData.landlord.email
            });
            continue;
          }

          // Minimum payout threshold ($10)
          if (payoutData.total_net < 1000) {
            logger.info('Payout amount below minimum threshold', {
              landlordId: payoutData.landlord._id,
              amount: payoutData.total_net
            });
            continue;
          }

          // Process payout
          const payout = await this.createPayout(payoutData, paymentAccount);
          await this.executePayout(payout);
          
          processed++;

        } catch (error) {
          logger.error('Individual payout failed', {
            landlordId: payoutData.landlord._id,
            error: error.message
          });
          failed++;
        }
      }

      logger.info('Payout processing completed', { processed, failed });
      return { processed, failed };

    } catch (error) {
      logger.error('Payout processing job failed', { error: error.message });
      throw error;
    }
  }

  async createPayout(payoutData, paymentAccount) {
    const payout = new Payout({
      landlord_id: payoutData.landlord._id,
      payout_batch_id: `payout_${Date.now()}_${payoutData.landlord._id.toString().slice(-6)}`,
      gross_amount: payoutData.total_gross,
      platform_fee: payoutData.total_platform_fee,
      gateway_fee: payoutData.total_gateway_fee,
      net_payout: payoutData.total_net,
      currency: 'usd',
      gateway: paymentAccount.account_type,
      transaction_ids: payoutData.transactions.map(t => t._id),
      status: 'pending',
      payout_period_start: new Date(Math.min(...payoutData.transactions.map(t => t.created_at))),
      payout_period_end: new Date(Math.max(...payoutData.transactions.map(t => t.created_at))),
      scheduled_payout_date: new Date()
    });

    await payout.save();

    logger.info('Payout created', {
      payoutId: payout._id,
      landlordId: payoutData.landlord._id,
      amount: payoutData.total_net,
      transactionCount: payoutData.transactions.length
    });

    return payout;
  }

  async executePayout(payout) {
    try {
      payout.status = 'processing';
      await payout.save();

      const landlord = await User.findById(payout.landlord_id);
      const paymentAccount = await PaymentAccount.findOne({
        user_id: payout.landlord_id
      });

      let payoutResult;

      if (payout.gateway === 'stripe_connect') {
        // Stripe Connect transfer
        payoutResult = await stripeService.createTransfer(
          payout.net_payout,
          paymentAccount.stripe_account_id,
          {
            payout_id: payout._id.toString(),
            landlord_id: payout.landlord_id.toString(),
            period: `${payout.payout_period_start.toISOString().split('T')[0]} to ${payout.payout_period_end.toISOString().split('T')[0]}`
          }
        );

        if (payoutResult.success) {
          payout.stripe_transfer_id = payoutResult.transfer_id;
          payout.status = 'completed';
          payout.actual_payout_date = new Date();
        } else {
          throw new Error(payoutResult.error);
        }

      } else if (payout.gateway === 'paypal') {
        // PayPal payout
        payoutResult = await paypalService.createPayout(
          landlord.email,
          payout.net_payout,
          `Rent payout for period ${payout.payout_period_start.toISOString().split('T')[0]} to ${payout.payout_period_end.toISOString().split('T')[0]}`
        );

        if (payoutResult.success) {
          payout.paypal_batch_id = payoutResult.batch_id;
          payout.status = 'completed';
          payout.actual_payout_date = new Date();
        } else {
          throw new Error(payoutResult.error);
        }
      }

      await payout.save();

      // Mark transactions as paid out
      await Transaction.updateMany(
        { _id: { $in: payout.transaction_ids } },
        { 
          payout_processed: true,
          payout_id: payout._id,
          payout_date: payout.actual_payout_date
        }
      );

      logger.info('Payout executed successfully', {
        payoutId: payout._id,
        landlordId: payout.landlord_id,
        amount: payout.net_payout,
        gateway: payout.gateway
      });

      return payout;

    } catch (error) {
      payout.status = 'failed';
      payout.failure_message = error.message;
      payout.retry_count += 1;
      payout.next_retry_date = new Date(Date.now() + Math.pow(2, payout.retry_count) * 60 * 60 * 1000); // Exponential backoff
      await payout.save();

      logger.error('Payout execution failed', {
        payoutId: payout._id,
        landlordId: payout.landlord_id,
        error: error.message
      });

      throw error;
    }
  }

  // ============= PAYOUT QUERIES =============

  async getLandlordPayoutHistory(landlord_id, page = 1, limit = 10) {
    const payouts = await Payout.find({ landlord_id })
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('transaction_ids', 'amount created_at description');

    const total = await Payout.countDocuments({ landlord_id });

    return {
      payouts,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_payouts: total,
        has_next: page * limit < total,
        has_prev: page > 1
      }
    };
  }

 async getPayoutSummary(landlord_id) {
   const [
     totalEarnings,
     pendingAmount,
     lastPayout,
     payoutCount
   ] = await Promise.all([
     // Total lifetime earnings
     Transaction.aggregate([
       {
         $match: {
           payee_id: landlord_id,
           transaction_type: 'rent_payment',
           status: TRANSACTION_STATUS.COMPLETED
         }
       },
       {
         $group: {
           _id: null,
           total_gross: { $sum: '$amount' },
           total_platform_fee: { $sum: '$platform_fee' },
           total_net: { $sum: '$net_amount' }
         }
       }
     ]),

     // Pending payout amount
     Transaction.aggregate([
       {
         $match: {
           payee_id: landlord_id,
           transaction_type: 'rent_payment',
           status: TRANSACTION_STATUS.COMPLETED,
           escrow_released: true,
           payout_processed: { $ne: true }
         }
       },
       {
         $group: {
           _id: null,
           pending_amount: { $sum: '$net_amount' }
         }
       }
     ]),

     // Last payout
     Payout.findOne({ landlord_id, status: 'completed' })
       .sort({ actual_payout_date: -1 }),

     // Total payout count
     Payout.countDocuments({ landlord_id, status: 'completed' })
   ]);

   return {
     lifetime_earnings: {
       gross_amount: totalEarnings[0]?.total_gross || 0,
       platform_fees: totalEarnings[0]?.total_platform_fee || 0,
       net_amount: totalEarnings[0]?.total_net || 0
     },
     pending_payout: pendingAmount[0]?.pending_amount || 0,
     last_payout: lastPayout ? {
       amount: lastPayout.net_payout,
       date: lastPayout.actual_payout_date,
       gateway: lastPayout.gateway
     } : null,
     total_payouts: payoutCount,
     next_payout_date: this.getNextPayoutDate()
   };
 }

 // ============= RETRY FAILED PAYOUTS =============

 async retryFailedPayouts() {
   const failedPayouts = await Payout.find({
     status: 'failed',
     retry_count: { $lt: 3 }, // Max 3 retries
     next_retry_date: { $lte: new Date() }
   }).limit(10);

   let retried = 0;

   for (const payout of failedPayouts) {
     try {
       await this.executePayout(payout);
       retried++;
     } catch (error) {
       logger.error('Payout retry failed', {
         payoutId: payout._id,
         attempt: payout.retry_count,
         error: error.message
       });
     }
   }

   return retried;
 }

 // ============= HELPER METHODS =============

 getNextPayoutDate() {
   // Weekly payouts on Fridays
   const today = new Date();
   const friday = new Date(today);
   friday.setDate(today.getDate() + (5 - today.getDay() + 7) % 7);
   friday.setHours(10, 0, 0, 0); // 10 AM
   
   return friday;
 }

 async scheduleAutomaticPayouts() {
   // This would be called by a cron job
   const today = new Date();
   const dayOfWeek = today.getDay();
   
   // Run payouts on Fridays
   if (dayOfWeek === 5) {
     return await this.processPendingPayouts();
   }
   
   return { processed: 0, failed: 0, message: 'Not payout day' };
 }
}

export const payoutService = new PayoutService();