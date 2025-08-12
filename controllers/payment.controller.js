// controllers/payment.controller.js
import { paymentService } from "../services/index.js";
import { logger, ApiResponse, ApiError } from "../utils/index.js";
import { constants } from '../utils/index.js';
import { SUBSCRIPTION_STATUS, SUBSCRIPTION_TYPES, ACCOUNT_STATUS, ACCOUNT_TYPES, KYC_STATUS, TRANSACTION_TYPES, TRANSACTION_STATUS } from '../utils/enums.js';
import { User, Transaction, Subscription, PaymentAccount } from '../models/index.js';

/**
 * Create one-time payment (background checks, listing fees, contracts)
 */
export const createOneTimePayment = async (req, res) => {
  const userId = req.user._id;
  const { service_type, gateway = constants.PAYMENT_GATEWAYS.STRIPE } = req.body;

  logger.info("One-time payment creation attempt", { userId, service_type, gateway });

  try {
    // Validate service type
    if (!constants.SERVICE_PRICING[service_type.toUpperCase()]) {
      throw new ApiError(400, 'Invalid service type');
    }

    // Validate gateway
    if (!Object.values(constants.PAYMENT_GATEWAYS).includes(gateway)) {
      throw new ApiError(400, 'Invalid payment gateway');
    }

    const result = await paymentService.createOneTimePayment(userId, service_type, gateway);

    if (!result.success) {
      throw new ApiError(400, result.error);
    }

    logger.info("One-time payment created successfully", {
      userId,
      transactionId: result.transaction_id,
      amount: result.amount,
      gateway: result.gateway
    });

    res.status(200).json(
      new ApiResponse(200, {
        transaction_id: result.transaction_id,
        amount: result.amount,
        gateway: result.gateway,
        payment_data: result.payment_data
      }, "Payment initiated successfully")
    );
  } catch (error) {
    logger.error("One-time payment creation failed", { userId, service_type, error: error.message });
    throw new ApiError(400, error.message);
  }
};

/**
 * Confirm one-time payment
 */
export const confirmOneTimePayment = async (req, res) => {
  const userId = req.user._id;
  const { transaction_id, gateway_transaction_id } = req.body;

  logger.info("Payment confirmation attempt", { userId, transaction_id });

  try {
    const transaction = await Transaction.findOne({
      _id: transaction_id,
      payer_id: userId
    });

    if (!transaction) {
      throw new ApiError(404, 'Transaction not found');
    }

    // Update transaction status
    transaction.status = TRANSACTION_STATUS.COMPLETED;
    transaction.processed_at = new Date();

    if (transaction.gateway === constants.PAYMENT_GATEWAYS.STRIPE) {
      transaction.stripe_payment_intent_id = gateway_transaction_id;
    } else if (transaction.gateway === constants.PAYMENT_GATEWAYS.PAYPAL) {
      transaction.paypal_transaction_id = gateway_transaction_id;
    }

    await transaction.save();

    // Trigger service activation based on transaction type
    await activateService(transaction);

    logger.info("Payment confirmed successfully", { userId, transaction_id });

    res.status(200).json(
      new ApiResponse(200, {
        transaction_id: transaction._id,
        status: transaction.status,
        service_activated: true
      }, "Payment confirmed successfully")
    );
  } catch (error) {
    logger.error("Payment confirmation failed", { userId, transaction_id, error: error.message });
    throw new ApiError(400, error.message);
  }
};

/**
 * Create subscription (roommate, agency, university, bank)
 */
export const createSubscription = async (req, res) => {
  const userId = req.user._id;
  const { subscription_type, gateway = constants.PAYMENT_GATEWAYS.STRIPE } = req.body;

  logger.info("Subscription creation attempt", { userId, subscription_type, gateway });

  try {
    // Validate subscription type
    if (!Object.values(SUBSCRIPTION_TYPES).includes(subscription_type)) {
      throw new ApiError(400, 'Invalid subscription type');
    }

    const result = await paymentService.createSubscription(userId, subscription_type, gateway);

    if (!result.success) {
      throw new ApiError(400, result.error);
    }

    logger.info("Subscription created successfully", {
      userId,
      subscriptionId: result.subscription_id,
      subscription_type,
      gateway: result.gateway
    });

    res.status(200).json(
      new ApiResponse(200, {
        subscription_id: result.subscription_id,
        gateway: result.gateway,
        subscription_data: result.subscription_data
      }, "Subscription created successfully")
    );
  } catch (error) {
    logger.error("Subscription creation failed", { userId, subscription_type, error: error.message });
    throw new ApiError(400, error.message);
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (req, res) => {
  const userId = req.user._id;
  const { subscription_id } = req.params;

  logger.info("Subscription cancellation attempt", { userId, subscription_id });

  try {
    const subscription = await Subscription.findOne({
      _id: subscription_id,
      user_id: userId
    });

    if (!subscription) {
      throw new ApiError(404, 'Subscription not found');
    }

    if (subscription.status === SUBSCRIPTION_STATUS.CANCELED) {
      throw new ApiError(400, 'Subscription is already cancelled');
    }

    // Cancel subscription with payment gateway
    let cancelResult;
    if (subscription.gateway === constants.PAYMENT_GATEWAYS.STRIPE) {
      const { stripeService } = await import('../services/index.js');
      cancelResult = await stripeService.cancelSubscription(subscription.stripe_subscription_id);
    } else if (subscription.gateway === constants.PAYMENT_GATEWAYS.PAYPAL) {
      const { paypalService } = await import('../services/index.js');
      cancelResult = await paypalService.cancelSubscription(subscription.paypal_subscription_id);
    }

    if (!cancelResult.success) {
      throw new ApiError(400, cancelResult.error);
    }

    // Update subscription status
    subscription.status = SUBSCRIPTION_STATUS.CANCELED;
    subscription.canceled_at = new Date();
    subscription.cancel_at_period_end = true;
    await subscription.save();

    logger.info("Subscription cancelled successfully", { userId, subscription_id });

    res.status(200).json(
      new ApiResponse(200, {
        subscription_id: subscription._id,
        status: subscription.status,
        canceled_at: subscription.canceled_at
      }, "Subscription cancelled successfully")
    );
  } catch (error) {
    logger.error("Subscription cancellation failed", { userId, subscription_id, error: error.message });
    throw new ApiError(400, error.message);
  }
};

/**
 * Get subscription status
 */
export const getSubscriptionStatus = async (req, res) => {
  const userId = req.user._id;
  const { subscription_id } = req.params;

  logger.info("Getting subscription status", { userId, subscription_id });

  try {
    const subscription = await Subscription.findOne({
      _id: subscription_id,
      user_id: userId
    });

    if (!subscription) {
      throw new ApiError(404, 'Subscription not found');
    }

    logger.info("Subscription status retrieved", { userId, subscription_id });

    res.status(200).json(
      new ApiResponse(200, {
        subscription_id: subscription._id,
        subscription_type: subscription.subscription_type,
        status: subscription.status,
        amount: subscription.amount,
        billing_interval: subscription.billing_interval,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        subscription_data: subscription.subscription_data
      }, "Subscription status retrieved successfully")
    );
  } catch (error) {
    logger.error("Failed to get subscription status", { userId, subscription_id, error: error.message });
    throw new ApiError(400, error.message);
  }
};

/**
 * Setup payment account (for landlords)
 */
export const setupPaymentAccount = async (req, res) => {
  const userId = req.user._id;
  const { gateway = constants.PAYMENT_GATEWAYS.STRIPE } = req.body;

  logger.info("Payment account setup attempt", { userId, gateway });

  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Check if payment account already exists
    const existingAccount = await PaymentAccount.findOne({ user_id: userId });
    if (existingAccount && existingAccount.account_status === ACCOUNT_STATUS.ACTIVE) {
      throw new ApiError(400, 'Payment account already set up');
    }

    let result;
    if (gateway === constants.PAYMENT_GATEWAYS.STRIPE) {
      const { stripeService } = await import('../services/index.js');

      // Create Stripe Connect account
      const accountResult = await stripeService.createConnectAccount(user);
      if (!accountResult.success) {
        throw new ApiError(400, accountResult.error);
      }

      // Generate onboarding link
      const linkResult = await stripeService.createAccountLink(accountResult.account_id);
      if (!linkResult.success) {
        throw new ApiError(400, linkResult.error);
      }

      // Save payment account
      const paymentAccount = new PaymentAccount({
        user_id: userId,
        account_type: ACCOUNT_TYPES.STRIPE_CONNECT,
        stripe_account_id: accountResult.account_id,
        account_status: ACCOUNT_STATUS.PENDING,
        kyc_status: KYC_STATUS.PENDING,
        payout_enabled: false
      });

      await paymentAccount.save();

      result = {
        gateway: gateway,
        account_id: accountResult.account_id,
        onboarding_url: linkResult.onboarding_url
      };
    }

    logger.info("Payment account setup initiated", { userId, gateway });

    res.status(200).json(
      new ApiResponse(200, result, "Payment account setup initiated")
    );
  } catch (error) {
    logger.error("Payment account setup failed", { userId, gateway, error: error.message });
    throw new ApiError(400, error.message);
  }
};

/**
 * Get payment account status
 */
export const getPaymentAccountStatus = async (req, res) => {
  const userId = req.user._id;

  logger.info("Getting payment account status", { userId });

  try {
    const paymentAccount = await PaymentAccount.findOne({ user_id: userId });

    if (!paymentAccount) {
      res.status(200).json(
        new ApiResponse(200, {
          has_payment_account: false,
          status: 'not_setup'
        }, "Payment account status retrieved")
      );
      return;
    }

    logger.info("Payment account status retrieved", { userId });

    res.status(200).json(
      new ApiResponse(200, {
        has_payment_account: true,
        account_type: paymentAccount.account_type,
        account_status: paymentAccount.account_status,
        kyc_status: paymentAccount.kyc_status,
        payout_enabled: paymentAccount.payout_enabled,
        created_at: paymentAccount.created_at
      }, "Payment account status retrieved")
    );
  } catch (error) {
    logger.error("Failed to get payment account status", { userId, error: error.message });
    throw new ApiError(400, error.message);
  }
};

/**
 * Create rent payment (tenant to landlord)
 */
export const createRentPayment = async (req, res) => {
  const userId = req.user._id; // Tenant ID
  const { landlord_id, property_id, amount, gateway = constants.PAYMENT_GATEWAYS.STRIPE } = req.body;

  logger.info("Rent payment creation attempt", { userId, landlord_id, property_id, amount, gateway });

  try {
    const result = await paymentService.createRentPayment(
      userId,
      landlord_id,
      property_id,
      amount,
      gateway
    );

    if (!result.success) {
      throw new ApiError(400, result.error);
    }

    logger.info("Rent payment created successfully", {
      userId,
      transactionId: result.transaction_id,
      landlord_id,
      property_id
    });

    res.status(200).json(
      new ApiResponse(200, {
        transaction_id: result.transaction_id,
        payment_data: result.payment_data,
        escrow_release_date: result.escrow_release_date
      }, "Rent payment initiated successfully")
    );
  } catch (error) {
    logger.error("Rent payment failed", { userId, landlord_id, property_id, error: error.message });
    throw new ApiError(400, error.message);
  }
};

/**
 * Get transaction history
 */
export const getTransactionHistory = async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10, transaction_type, status } = req.query;

  logger.info("Getting transaction history", { userId, page, limit });

  try {
    const filter = {
      $or: [
        { payer_id: userId },
        { payee_id: userId }
      ]
    };

    if (transaction_type) {
      filter.transaction_type = transaction_type;
    }

    if (status) {
      filter.status = status;
    }

    const transactions = await Transaction.find(filter)
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('payer_id', 'first_name last_name email')
      .populate('payee_id', 'first_name last_name email');

    const total = await Transaction.countDocuments(filter);

    logger.info("Transaction history retrieved", { userId, count: transactions.length });

    res.status(200).json(
      new ApiResponse(200, {
        transactions,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_transactions: total,
          has_next: page * limit < total,
          has_prev: page > 1
        }
      }, "Transaction history retrieved successfully")
    );
  } catch (error) {
    logger.error("Failed to get transaction history", { userId, error: error.message });
    throw new ApiError(400, error.message);
  }
};

/**
 * Get specific transaction
 */
export const getTransaction = async (req, res) => {
  const userId = req.user._id;
  const { transaction_id } = req.params;

  logger.info("Getting transaction details", { userId, transaction_id });

  try {
    const transaction = await Transaction.findOne({
      _id: transaction_id,
      $or: [
        { payer_id: userId },
        { payee_id: userId }
      ]
    })
      .populate('payer_id', 'first_name last_name email')
      .populate('payee_id', 'first_name last_name email');

    if (!transaction) {
      throw new ApiError(404, 'Transaction not found');
    }

    logger.info("Transaction details retrieved", { userId, transaction_id });

    res.status(200).json(
      new ApiResponse(200, transaction, "Transaction retrieved successfully")
    );
  } catch (error) {
    logger.error("Failed to get transaction", { userId, transaction_id, error: error.message });
    throw new ApiError(400, error.message);
  }
};

/**
 * Get service pricing information
 */
export const getServicePricing = async (req, res) => {
  logger.info("Getting service pricing");

  try {
    const pricing = {
      background_checks: {
        background_check: constants.SERVICE_PRICING.BACKGROUND_CHECK / 100,
        income_check: constants.SERVICE_PRICING.INCOME_CHECK / 100,
        social_credit_check: constants.SERVICE_PRICING.SOCIAL_CREDIT_CHECK / 100
      },
      listing_services: {
        basic_listing: constants.SERVICE_PRICING.BASIC_LISTING / 100,
        premium_listing: constants.SERVICE_PRICING.PREMIUM_LISTING / 100,
        listing_boost: constants.SERVICE_PRICING.LISTING_BOOST / 100
      },
      subscriptions: {
        roommate_weekly: constants.SERVICE_PRICING.ROOMMATE_WEEKLY / 100,
        landlord_monthly: constants.SERVICE_PRICING.LANDLORD_MONTHLY / 100,
        agency_monthly: constants.SERVICE_PRICING.AGENCY_MONTHLY / 100,
        university_monthly: constants.SERVICE_PRICING.UNIVERSITY_MONTHLY / 100,
        bank_ad_monthly: constants.SERVICE_PRICING.BANK_AD_MONTHLY / 100
      },
      digital_services: {
        contract_fee: constants.SERVICE_PRICING.CONTRACT_FEE / 100
      }
    };

    res.status(200).json(
      new ApiResponse(200, pricing, "Service pricing retrieved successfully")
    );
  } catch (error) {
    logger.error("Failed to get service pricing", { error: error.message });
    throw new ApiError(400, error.message);
  }
};

// ============= HELPER FUNCTION =============

const activateService = async (transaction) => {
  try {
    const { transaction_type, payer_id, metadata } = transaction;

    switch (transaction_type) {
      case TRANSACTION_TYPES.BACKGROUND_CHECK:
        // Trigger background check with Certn API
        logger.info("Activating background check service", { payer_id, check_type: metadata.check_type });
        break;

      case TRANSACTION_TYPES.LISTING_FEE:
        // Activate listing
        logger.info("Activating listing", { payer_id, listing_id: metadata.listing_id });
        break;

      case TRANSACTION_TYPES.CONTRACT_FEE:
        // Enable contract generation
        logger.info("Enabling contract generation", { payer_id, contract_id: metadata.contract_id });
        break;

      default:
        logger.info("No specific service activation needed", { transaction_type });
        break;
    }
  } catch (error) {
    logger.error("Service activation failed", { error: error.message });
  }
};