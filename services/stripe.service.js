// services/stripe.service.js
import { stripe, stripeConfig, env } from '../config/index.js';

export class StripeService {

  async createCustomer(user) {
    try {
      if (stripeConfig.mockPayments) {
        // Mock response for development
        return {
          success: true,
          customer_id: `cus_mock_${user._id}`
        };
      }

      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        metadata: {
          user_id: user._id.toString(),
          user_type: user.user_type,
          environment: env.NODE_ENV
        }
      });

      return {
        success: true,
        customer_id: customer.id
      };
    } catch (error) {
      if (stripeConfig.debugMode) {
        console.error('Stripe Customer Creation Error:', error);
      }
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createPaymentIntent(amount, customer_id, metadata = {}) {
    try {
      if (stripeConfig.mockPayments) {
        // Mock response for development
        return {
          success: true,
          payment_intent_id: `pi_mock_${Date.now()}`,
          client_secret: `pi_mock_${Date.now()}_secret_mock`
        };
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: stripeConfig.defaultCurrency,
        customer: customer_id,
        ...stripeConfig.paymentIntentDefaults,
        metadata: {
          ...metadata,
          created_by: 'moveinn',
          environment: env.NODE_ENV
        }
      });

      return {
        success: true,
        payment_intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret
      };
    } catch (error) {
      if (stripeConfig.debugMode) {
        console.error('Stripe Payment Intent Error:', error);
      }
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ============= SUBSCRIPTIONS =============

  async createSubscription(customer_id, price_id, metadata = {}) {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customer_id,
        items: [{ price: price_id }],
        ...stripeConfig.subscriptionDefaults,
        metadata: {
          ...metadata,
          created_by: 'moveinn'
        }
      });

      return {
        success: true,
        subscription_id: subscription.id,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async cancelSubscription(subscription_id) {
    try {
      const subscription = await stripe.subscriptions.update(subscription_id, {
        cancel_at_period_end: true
      });

      return {
        success: true,
        subscription: subscription
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ============= STRIPE CONNECT (For Landlords) =============

  async createConnectAccount(user) {
    try {
      const account = await stripe.accounts.create({
        type: stripeConfig.connectAccountType,
        country: stripeConfig.connectCountry,
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        metadata: {
          user_id: user._id.toString(),
          created_by: 'moveinn'
        }
      });

      return {
        success: true,
        account_id: account.id
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createAccountLink(account_id) {
    try {
      const accountLink = await stripe.accountLinks.create({
        account: account_id,
        refresh_url: stripeConfig.connectRefreshUrl,
        return_url: stripeConfig.connectReturnUrl,
        type: 'account_onboarding'
      });

      return {
        success: true,
        onboarding_url: accountLink.url
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getConnectAccount(account_id) {
    try {
      const account = await stripe.accounts.retrieve(account_id);
      return {
        success: true,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ============= RENT PAYMENTS (Marketplace) =============

  async createMarketplacePayment(amount, customer_id, connect_account_id, application_fee, metadata = {}) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: stripeConfig.defaultCurrency,
        customer: customer_id,
        application_fee_amount: application_fee,
        transfer_data: {
          destination: connect_account_id
        },
        ...stripeConfig.paymentIntentDefaults,
        metadata: {
          ...metadata,
          marketplace_payment: 'true'
        }
      });

      return {
        success: true,
        payment_intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ============= WEBHOOK VERIFICATION =============

  async verifyWebhookSignature(payload, signature, webhook_secret = stripeConfig.webhookSecret) {
    try {
      const event = stripe.webhooks.constructEvent(payload, signature, webhook_secret);
      return { success: true, event };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export const stripeService = new StripeService();