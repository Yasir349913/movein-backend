// services/webhook.service.js
import { WebhookEvent, Transaction, Subscription, User } from '../models/index.js';
import { stripeService, paypalService } from './index.js';
import { TRANSACTION_STATUS, SUBSCRIPTION_STATUS } from '../utils/enums.js';
import { logger } from '../utils/index.js';

class WebhookService {

  // ============= STRIPE WEBHOOKS =============

  async processStripeWebhook(payload, signature) {
    try {
      // 1. Verify webhook signature
      const verification = await stripeService.verifyWebhookSignature(
        payload, 
        signature
      );

      if (!verification.success) {
        throw new Error(`Webhook verification failed: ${verification.error}`);
      }

      const event = verification.event;

      // 2. Check if already processed
      const existingEvent = await WebhookEvent.findOne({
        webhook_id: event.id,
        gateway: 'stripe'
      });

      if (existingEvent?.processed) {
        logger.info('Webhook already processed', { eventId: event.id });
        return { success: true, message: 'Already processed' };
      }

      // 3. Save webhook event
      const webhookEvent = await this.saveWebhookEvent(event, 'stripe');

      // 4. Process based on event type
      await this.handleStripeEvent(event, webhookEvent);

      // 5. Mark as processed
      webhookEvent.processed = true;
      webhookEvent.processed_at = new Date();
      await webhookEvent.save();

      logger.info('Stripe webhook processed successfully', { 
        eventId: event.id, 
        type: event.type 
      });

      return { success: true, message: 'Webhook processed' };

    } catch (error) {
      logger.error('Stripe webhook processing failed', { error: error.message });
      
      // Save failed webhook for retry
      if (payload && signature) {
        await this.saveFailedWebhook(payload, 'stripe', error.message);
      }
      
      throw error;
    }
  }

  async handleStripeEvent(event, webhookEvent) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object, webhookEvent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object, webhookEvent);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object, webhookEvent);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionCancelled(event.data.object, webhookEvent);
        break;

      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event.data.object, webhookEvent);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object, webhookEvent);
        break;

      case 'account.updated':
        await this.handleConnectAccountUpdated(event.data.object, webhookEvent);
        break;

      default:
        logger.info('Unhandled Stripe webhook event', { type: event.type });
        break;
    }
  }

  // ============= PAYPAL WEBHOOKS =============

  async processPayPalWebhook(payload, headers) {
    try {
      // 1. Verify webhook (simplified - PayPal verification is complex)
      const event = JSON.parse(payload);

      // 2. Check if already processed
      const existingEvent = await WebhookEvent.findOne({
        webhook_id: event.id,
        gateway: 'paypal'
      });

      if (existingEvent?.processed) {
        logger.info('PayPal webhook already processed', { eventId: event.id });
        return { success: true, message: 'Already processed' };
      }

      // 3. Save webhook event
      const webhookEvent = await this.saveWebhookEvent(event, 'paypal');

      // 4. Process based on event type
      await this.handlePayPalEvent(event, webhookEvent);

      // 5. Mark as processed
      webhookEvent.processed = true;
      webhookEvent.processed_at = new Date();
      await webhookEvent.save();

      logger.info('PayPal webhook processed successfully', { 
        eventId: event.id, 
        type: event.event_type 
      });

      return { success: true, message: 'Webhook processed' };

    } catch (error) {
      logger.error('PayPal webhook processing failed', { error: error.message });
      throw error;
    }
  }

  async handlePayPalEvent(event, webhookEvent) {
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await this.handlePayPalPaymentCompleted(event.resource, webhookEvent);
        break;

      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await this.handlePayPalSubscriptionActivated(event.resource, webhookEvent);
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await this.handlePayPalSubscriptionCancelled(event.resource, webhookEvent);
        break;

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await this.handlePayPalPaymentFailed(event.resource, webhookEvent);
        break;

      default:
        logger.info('Unhandled PayPal webhook event', { type: event.event_type });
        break;
    }
  }

  // ============= WEBHOOK EVENT HANDLERS =============

  async handlePaymentSuccess(paymentIntent, webhookEvent) {
    const transaction = await Transaction.findOne({
      stripe_payment_intent_id: paymentIntent.id
    });

    if (transaction) {
      transaction.status = TRANSACTION_STATUS.COMPLETED;
      transaction.processed_at = new Date();
      await transaction.save();

      webhookEvent.related_transaction_id = transaction._id;
      webhookEvent.related_user_id = transaction.payer_id;
      await webhookEvent.save();

      // Trigger service activation
      await this.activateService(transaction);

      logger.info('Payment marked as completed', { 
        transactionId: transaction._id,
        amount: transaction.amount 
      });
    }
  }

  async handlePaymentFailed(paymentIntent, webhookEvent) {
    const transaction = await Transaction.findOne({
      stripe_payment_intent_id: paymentIntent.id
    });

    if (transaction) {
      transaction.status = TRANSACTION_STATUS.FAILED;
      transaction.failure_reason = paymentIntent.last_payment_error?.message || 'Payment failed';
      await transaction.save();

      webhookEvent.related_transaction_id = transaction._id;
      await webhookEvent.save();

      logger.info('Payment marked as failed', { 
        transactionId: transaction._id,
        reason: transaction.failure_reason
      });
    }
  }

  async handleSubscriptionUpdated(stripeSubscription, webhookEvent) {
    const subscription = await Subscription.findOne({
      stripe_subscription_id: stripeSubscription.id
    });

    if (subscription) {
      subscription.status = this.mapStripeSubscriptionStatus(stripeSubscription.status);
      subscription.current_period_start = new Date(stripeSubscription.current_period_start * 1000);
      subscription.current_period_end = new Date(stripeSubscription.current_period_end * 1000);
      
      if (stripeSubscription.canceled_at) {
        subscription.canceled_at = new Date(stripeSubscription.canceled_at * 1000);
      }

      await subscription.save();

      webhookEvent.related_subscription_id = subscription._id;
      webhookEvent.related_user_id = subscription.user_id;
      await webhookEvent.save();

      logger.info('Subscription updated', { 
        subscriptionId: subscription._id,
        status: subscription.status 
      });
    }
  }

  async handleInvoicePaymentSucceeded(invoice, webhookEvent) {
    // Create transaction record for successful subscription payment
    const subscription = await Subscription.findOne({
      stripe_subscription_id: invoice.subscription
    });

    if (subscription) {
      const transaction = new Transaction({
        transaction_type: subscription.subscription_type,
        payer_id: subscription.user_id,
        payee_id: null, // Platform revenue
        amount: invoice.amount_paid,
        platform_fee: 0,
        gateway_fee: Math.round(invoice.amount_paid * 0.029) + 30, // Stripe fee
        net_amount: invoice.amount_paid - Math.round(invoice.amount_paid * 0.029) - 30,
        currency: 'usd',
        gateway: 'stripe',
        status: TRANSACTION_STATUS.COMPLETED,
        stripe_payment_intent_id: invoice.payment_intent,
        description: `${subscription.subscription_type} subscription payment`,
        processed_at: new Date(),
        metadata: {
          subscription_id: subscription._id,
          billing_period_start: subscription.current_period_start,
          billing_period_end: subscription.current_period_end,
          invoice_id: invoice.id
        }
      });

      await transaction.save();

      webhookEvent.related_transaction_id = transaction._id;
      webhookEvent.related_subscription_id = subscription._id;
      await webhookEvent.save();

      logger.info('Subscription payment recorded', { 
        subscriptionId: subscription._id,
        transactionId: transaction._id,
        amount: invoice.amount_paid
      });
    }
  }

  async handleConnectAccountUpdated(account, webhookEvent) {
    // Update PaymentAccount status when Stripe Connect account changes
    const paymentAccount = await PaymentAccount.findOne({
      stripe_account_id: account.id
    });

    if (paymentAccount) {
      paymentAccount.account_status = account.charges_enabled ? 'active' : 'pending';
      paymentAccount.kyc_status = account.details_submitted ? 'verified' : 'pending';
      paymentAccount.payout_enabled = account.payouts_enabled;
      await paymentAccount.save();

      webhookEvent.related_user_id = paymentAccount.user_id;
      await webhookEvent.save();

      logger.info('Payment account updated', { 
        accountId: account.id,
        status: paymentAccount.account_status 
      });
    }
  }

  async handleInvoicePaymentFailed(invoice, webhookEvent) {
    // Handle failed invoice payment for subscriptions
    const subscription = await Subscription.findOne({
      stripe_subscription_id: invoice.subscription
    }); 
    if (subscription) {
      subscription.status = SUBSCRIPTION_STATUS.PAST_DUE;
      subscription.past_due_at = new Date();
      await subscription.save();
      webhookEvent.related_subscription_id = subscription._id;
      webhookEvent.related_user_id = subscription.user_id;
      await webhookEvent.save();
      logger.info('Subscription payment failed', {
        subscriptionId: subscription._id,
        userId: subscription.user_id,
        amount: invoice.amount_due
      });
    }
  }

  async handleSubscriptionCancelled(stripeSubscription, webhookEvent) {
    const subscription = await Subscription.findOne({
      stripe_subscription_id: stripeSubscription.id
    }); 
    if (subscription) {
      subscription.status = SUBSCRIPTION_STATUS.CANCELED;
      subscription.canceled_at = new Date(stripeSubscription.canceled_at * 1000);
      await subscription.save();
      webhookEvent.related_subscription_id = subscription._id;
      webhookEvent.related_user_id = subscription.user_id;
      await webhookEvent.save();
      logger.info('Subscription cancelled', {
        subscriptionId: subscription._id,
        userId: subscription.user_id
      });
    }
  }

  async handlePayPalPaymentCompleted(payment, webhookEvent) {
    const transaction = await Transaction.findOne({
      paypal_payment_id: payment.id
    }); 
    if (transaction) {
      transaction.status = TRANSACTION_STATUS.COMPLETED;
      transaction.processed_at = new Date();
      await transaction.save();
      webhookEvent.related_transaction_id = transaction._id;
      webhookEvent.related_user_id = transaction.payer_id;
      await webhookEvent.save();
      logger.info('PayPal payment completed', {
        transactionId: transaction._id,
        amount: transaction.amount
      });
    }
  }
  async handlePayPalSubscriptionActivated(subscription, webhookEvent) {
    const existingSubscription = await Subscription.findOne({
      paypal_subscription_id: subscription.id
    });
    if (existingSubscription) {
      existingSubscription.status = SUBSCRIPTION_STATUS.ACTIVE;
      existingSubscription.current_period_start = new Date(subscription.start_time);
      existingSubscription.current_period_end = new Date(subscription.billing_info.next_billing_time);
      await existingSubscription.save();
      webhookEvent.related_subscription_id = existingSubscription._id;
      webhookEvent.related_user_id = existingSubscription.user_id;
      await webhookEvent.save();
      logger.info('PayPal subscription activated', {
        subscriptionId: existingSubscription._id,
        userId: existingSubscription.user_id
      });
    }
  }

  async handlePayPalSubscriptionCancelled(subscription, webhookEvent) {
    const existingSubscription = await Subscription.findOne({
      paypal_subscription_id: subscription.id
    });
    if (existingSubscription) {
      existingSubscription.status = SUBSCRIPTION_STATUS.CANCELED;
      existingSubscription.canceled_at = new Date(subscription.update_time);
      await existingSubscription.save();
      webhookEvent.related_subscription_id = existingSubscription._id;
      webhookEvent.related_user_id = existingSubscription.user_id;
      await webhookEvent.save();
      logger.info('PayPal subscription cancelled', {
        subscriptionId: existingSubscription._id,
        userId: existingSubscription.user_id
      });
    }
  }


  async handlePayPalPaymentFailed(payment, webhookEvent) {
    const transaction = await Transaction.findOne({
      paypal_payment_id: payment.id
    });
    if (transaction) {
      transaction.status = TRANSACTION_STATUS.FAILED;
      transaction.failure_reason = payment.failure_reason || 'Payment failed';
      await transaction.save();
      webhookEvent.related_transaction_id = transaction._id;
      webhookEvent.processing_error = transaction.failure_reason;
      await webhookEvent.save();
      logger.info('PayPal payment failed', {
        transactionId: transaction._id,
        reason: transaction.failure_reason
      });
    }
  }



  // ============= HELPER METHODS =============

  async saveWebhookEvent(event, gateway) {
    return await WebhookEvent.create({
      webhook_id: event.id,
      event_type: gateway === 'stripe' ? event.type : event.event_type,
      gateway: gateway,
      event_data: event,
      processed: false,
      processing_attempts: 1
    });
  }

  async saveFailedWebhook(payload, gateway, error) {
    try {
      const event = JSON.parse(payload);
      const webhookEvent = await WebhookEvent.findOne({
        webhook_id: event.id,
        gateway: gateway
      });

      if (webhookEvent) {
        webhookEvent.processing_attempts += 1;
        webhookEvent.processing_error = error;
        webhookEvent.retry_after = new Date(Date.now() + 5 * 60 * 1000); // Retry in 5 minutes
        await webhookEvent.save();
      }
    } catch (parseError) {
      logger.error('Failed to save failed webhook', { error: parseError.message });
    }
  }

  mapStripeSubscriptionStatus(stripeStatus) {
    const statusMap = {
      'incomplete': SUBSCRIPTION_STATUS.INCOMPLETE,
      'incomplete_expired': SUBSCRIPTION_STATUS.INCOMPLETE_EXPIRED,
      'trialing': SUBSCRIPTION_STATUS.TRIALING,
      'active': SUBSCRIPTION_STATUS.ACTIVE,
      'past_due': SUBSCRIPTION_STATUS.PAST_DUE,
      'canceled': SUBSCRIPTION_STATUS.CANCELED,
      'unpaid': SUBSCRIPTION_STATUS.UNPAID
    };
    return statusMap[stripeStatus] || SUBSCRIPTION_STATUS.ACTIVE;
  }

  async activateService(transaction) {
    // Trigger service activation based on transaction type
    const { transaction_type, payer_id, metadata } = transaction;

    switch (transaction_type) {
      case 'background_check':
        // Integrate with Certn API
        logger.info('Activating background check', { 
          userId: payer_id, 
          checkType: metadata.check_type 
        });
        break;

      case 'listing_fee':
        // Activate listing
        logger.info('Activating listing', { 
          userId: payer_id, 
          listingId: metadata.listing_id 
        });
        break;

      case 'contract_fee':
        // Enable contract generation
        logger.info('Enabling contract generation', { 
          userId: payer_id, 
          contractId: metadata.contract_id 
        });
        break;

      default:
        logger.info('No specific service activation needed', { 
          transactionType: transaction_type 
        });
        break;
    }
  }

  // ============= RETRY FAILED WEBHOOKS =============

  async retryFailedWebhooks() {
    const failedWebhooks = await WebhookEvent.find({
      processed: false,
      processing_attempts: { $lt: 5 }, // Max 5 retries
      $or: [
        { retry_after: { $lte: new Date() } },
        { retry_after: { $exists: false } }
      ]
    }).limit(50);

    for (const webhook of failedWebhooks) {
      try {
        if (webhook.gateway === 'stripe') {
          await this.handleStripeEvent(webhook.event_data, webhook);
        } else if (webhook.gateway === 'paypal') {
          await this.handlePayPalEvent(webhook.event_data, webhook);
        }

        webhook.processed = true;
        webhook.processed_at = new Date();
        await webhook.save();

        logger.info('Retry webhook processed successfully', { 
          webhookId: webhook.webhook_id 
        });

      } catch (error) {
        webhook.processing_attempts += 1;
        webhook.processing_error = error.message;
        webhook.retry_after = new Date(Date.now() + Math.pow(2, webhook.processing_attempts) * 60 * 1000); // Exponential backoff
        await webhook.save();

        logger.error('Retry webhook failed', { 
          webhookId: webhook.webhook_id, 
          attempt: webhook.processing_attempts,
          error: error.message 
        });
      }
    }

    return failedWebhooks.length;
  }
}

export const webhookService = new WebhookService();