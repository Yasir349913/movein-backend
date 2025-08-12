import { constants } from '../utils/index.js';
import { TRANSACTION_STATUS, TRANSACTION_TYPES, SUBSCRIPTION_TYPES, SUBSCRIPTION_STATUS, ACCOUNT_STATUS } from '../utils/enums.js';
import { User, Transaction, PaymentAccount, Subscription, PaymentPlan } from '../models/index.js';
import { stripeService, paypalService } from './index.js';


export class PaymentService {
  // ============= UTILITY METHODS =============
  getServicePrice(service_type) {
    const priceKey = service_type.toUpperCase();
    return constants.SERVICE_PRICING[priceKey] || null;
  }

  getServiceDescription(service_type) {
    const descKey = service_type.toUpperCase();
    return constants.SERVICE_DESCRIPTIONS[descKey] || `Moveinn ${service_type} Service`;
  }

  calculateGatewayFee(amount, gateway) {
    if (gateway === constants.PAYMENT_GATEWAYS.STRIPE) {
      return Math.round(amount * constants.PLATFORM_FEES.STRIPE_PERCENTAGE) + constants.PLATFORM_FEES.STRIPE_FIXED_FEE;
    } else if (gateway === constants.PAYMENT_GATEWAYS.PAYPAL) {
      return Math.round(amount * constants.PLATFORM_FEES.PAYPAL_PERCENTAGE) + constants.PLATFORM_FEES.PAYPAL_FIXED_FEE;
    }
    return 0;
  }

  calculatePlatformCommission(amount, commission_rate = constants.PLATFORM_FEES.RENT_COMMISSION) {
    return Math.round(amount * commission_rate);
  }

  // ============= CUSTOMER MANAGEMENT =============

  async setupCustomer(user, gateway = constants.PAYMENT_GATEWAYS.STRIPE) {
    try {
      let result;

      if (gateway === constants.PAYMENT_GATEWAYS.STRIPE) {
        result = await stripeService.createCustomer(user);
        if (result.success) {
          await User.findByIdAndUpdate(user._id, {
            stripe_customer_id: result.customer_id
          });
        }
      }
      // PayPal doesn't require upfront customer creation

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ============= ONE-TIME PAYMENTS =============

  async createOneTimePayment(user_id, service_type, gateway = constants.PAYMENT_GATEWAYS.STRIPE) {
    try {
      const user = await User.findById(user_id);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const amount = this.getServicePrice(service_type);
      if (!amount) {
        return { success: false, error: 'Invalid service type' };
      }

      let paymentResult;

      if (gateway === constants.PAYMENT_GATEWAYS.STRIPE) {
        // Ensure customer exists
        if (!user.stripe_customer_id) {
          const customerResult = await this.setupCustomer(user, gateway);
          if (!customerResult.success) {
            return customerResult;
          }
        }

        paymentResult = await stripeService.createPaymentIntent(
          amount,
          user.stripe_customer_id,
          { service_type, user_id }
        );
      }
      else if (gateway === constants.PAYMENT_GATEWAYS.PAYPAL) {
        const description = this.getServiceDescription(service_type);
        paymentResult = await paypalService.createOrder(
          amount,
          description,
          user_id,
          { service_type }
        );
      }

      if (!paymentResult.success) {
        return paymentResult;
      }

      // Create transaction record
      const transaction = new Transaction({
        transaction_type: service_type,
        payer_id: user_id,
        payee_id: null, // Platform service
        amount: amount,
        platform_fee: 0, // 100% to Moveinn for services
        gateway_fee: this.calculateGatewayFee(amount, gateway),
        net_amount: amount - this.calculateGatewayFee(amount, gateway),
        currency: 'usd',
        gateway: gateway,
        status: TRANSACTION_STATUS.PENDING,
        stripe_payment_intent_id: paymentResult.payment_intent_id,
        paypal_order_id: paymentResult.order_id,
        description: this.getServiceDescription(service_type),
        metadata: {
          service_type: service_type,
          user_type: user.user_type
        }
      });

      await transaction.save();

      return {
        success: true,
        transaction_id: transaction._id,
        payment_data: paymentResult,
        amount: amount,
        gateway: gateway
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ============= SUBSCRIPTION MANAGEMENT =============

  async createSubscription(user_id, subscription_type, gateway = constants.PAYMENT_GATEWAYS.STRIPE) {
    try {
      const user = await User.findById(user_id);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Check if user already has active subscription of this type
      const existingSubscription = await Subscription.findOne({
        user_id: user_id,
        subscription_type: subscription_type,
        status: { $in: [SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.TRIALING] }
      });

      if (existingSubscription) {
        return {
          success: false,
          error: 'User already has an active subscription of this type'
        };
      }

      // Get subscription pricing
      const amount = this.getServicePrice(subscription_type);
      if (!amount) {
        return { success: false, error: 'Invalid subscription type' };
      }

      // Determine billing interval
      const billingInterval = subscription_type.includes('weekly') ? 'week' : 'month';

      let subscriptionResult;

      if (gateway === constants.PAYMENT_GATEWAYS.STRIPE) {
        // Get or create Stripe price ID for this subscription
        const plan = await PaymentPlan.findOne({ plan_id: subscription_type });
        if (!plan || !plan.stripe_price_id) {
          return { success: false, error: 'Subscription plan not configured' };
        }

        subscriptionResult = await stripeService.createSubscription(
          user.stripe_customer_id,
          plan.stripe_price_id,
          { subscription_type, user_id }
        );
      }
      else if (gateway === constants.PAYMENT_GATEWAYS.PAYPAL) {
        const plan = await PaymentPlan.findOne({ plan_id: subscription_type });
        if (!plan || !plan.paypal_plan_id) {
          return { success: false, error: 'PayPal subscription plan not configured' };
        }

        subscriptionResult = await paypalService.createSubscription(
          plan.paypal_plan_id,
          user_id,
          user.email,
          { first_name: user.first_name, last_name: user.last_name }
        );
      }

      if (!subscriptionResult.success) {
        return subscriptionResult;
      }

      // Create subscription record
      const subscription = new Subscription({
        user_id: user_id,
        subscription_type: subscription_type,
        amount: amount,
        currency: 'usd',
        billing_interval: billingInterval,
        gateway: gateway,
        stripe_subscription_id: subscriptionResult.subscription_id,
        paypal_subscription_id: subscriptionResult.subscription_id,
        stripe_customer_id: user.stripe_customer_id,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        current_period_start: subscriptionResult.current_period_start || new Date(),
        current_period_end: subscriptionResult.current_period_end || new Date(Date.now() + (billingInterval === 'week' ? 7 : 30) * 24 * 60 * 60 * 1000),
        subscription_data: this.getSubscriptionData(subscription_type, user),
        activated_at: new Date()
      });

      await subscription.save();

      return {
        success: true,
        subscription_id: subscription._id,
        subscription_data: subscriptionResult,
        gateway: gateway
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ============= SUBSCRIPTION DATA HELPER =============

  getSubscriptionData(subscription_type, user) {
    const baseData = {
      auto_renew: true,
      features_unlocked: true
    };

    switch (subscription_type) {
      case SUBSCRIPTION_TYPES.ROOMMATE_WEEKLY:
        return {
          ...baseData,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          features_locked_at: null
        };

      case SUBSCRIPTION_TYPES.AGENCY_UNLIMITED:
        return {
          ...baseData,
          company_name: user.company_info?.company_name || '',
          max_sub_accounts: constants.SUBSCRIPTION_LIMITS.AGENCY_SUB_ACCOUNTS,
          current_sub_accounts: 0,
          unlimited_listings: true,
          white_label_enabled: false
        };

      case SUBSCRIPTION_TYPES.UNIVERSITY_PARTNERSHIP:
        return {
          ...baseData,
          student_discount_percentage: constants.SUBSCRIPTION_LIMITS.UNIVERSITY_DISCOUNT,
          total_students: 0,
          trial_days: constants.TRIAL_PERIODS.UNIVERSITY_TRIAL
        };

      case SUBSCRIPTION_TYPES.LANDLORD_MONTHLY:
        return {
          ...baseData,
          activated_when_rented: null, // Set when property is actually rented
          property_id: null
        };

      case SUBSCRIPTION_TYPES.BANK_ADVERTISEMENT:
        return {
          ...baseData,
          company_name: user.company_info?.company_name || '',
          campaign_ids: [],
          analytics_enabled: true
        };

      default:
        return baseData;
    }
  }

  // ============= MARKETPLACE PAYMENTS =============

  async createRentPayment(tenant_id, landlord_id, property_id, amount, gateway = constants.PAYMENT_GATEWAYS.STRIPE) {
    try {
      const tenant = await User.findById(tenant_id);
      const landlord = await User.findById(landlord_id);

      if (!tenant || !landlord) {
        return { success: false, error: 'User not found' };
      }

      // Get landlord's payment account
      const landlordAccount = await PaymentAccount.findOne({
        user_id: landlord_id,
        account_status: ACCOUNT_STATUS.ACTIVE
      });

      if (!landlordAccount) {
        return { success: false, error: 'Landlord payment account not set up' };
      }

      // Calculate fees
      const platformFee = this.calculatePlatformCommission(amount);
      const gatewayFee = this.calculateGatewayFee(amount, gateway);
      const landlordAmount = amount - platformFee - gatewayFee;

      let paymentResult;

      if (gateway === constants.PAYMENT_GATEWAYS.STRIPE) {
        paymentResult = await stripeService.createMarketplacePayment(
          amount,
          tenant.stripe_customer_id,
          landlordAccount.stripe_account_id,
          platformFee,
          { property_id, rent_payment: 'true' }
        );
      }
      // PayPal marketplace payments would require different implementation

      if (!paymentResult.success) {
        return paymentResult;
      }

      // Create transaction with escrow
      const transaction = new Transaction({
        transaction_type: TRANSACTION_TYPES.RENT_PAYMENT,
        payer_id: tenant_id,
        payee_id: landlord_id,
        amount: amount,
        platform_fee: platformFee,
        gateway_fee: gatewayFee,
        net_amount: landlordAmount,
        currency: 'usd',
        gateway: gateway,
        status: TRANSACTION_STATUS.PENDING,
        stripe_payment_intent_id: paymentResult.payment_intent_id,
        escrow_hold_until: new Date(Date.now() + constants.ESCROW_SETTINGS.HOLD_PERIOD_DAYS * 24 * 60 * 60 * 1000),
        escrow_released: false,
        description: `Rent payment for property ${property_id}`,
        metadata: {
          property_id: property_id,
          rent_payment: true,
          escrow_period_days: constants.ESCROW_SETTINGS.HOLD_PERIOD_DAYS
        }
      });

      await transaction.save();

      return {
        success: true,
        transaction_id: transaction._id,
        payment_data: paymentResult,
        escrow_release_date: transaction.escrow_hold_until
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export const paymentService = new PaymentService();