// services/paypal.service.js
import { paypalClient, paypalConfig, env } from '../config/index.js';
import paypal from '@paypal/checkout-server-sdk';

export class PayPalService {

  async createOrder(amount, description, user_id) {
    try {
      if (paypalConfig.mockPayments) {
        // Mock response for development
        return {
          success: true,
          order_id: `order_mock_${Date.now()}`,
          approval_url: `${env.CLIENT_URL}/payment/paypal/mock?order_id=order_mock_${Date.now()}`
        };
      }

      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: paypalConfig.orderDefaults.intent,
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: (amount / 100).toFixed(2)
          },
          description: description,
          custom_id: user_id
        }],
        application_context: {
          ...paypalConfig.orderDefaults.application_context,
          return_url: paypalConfig.returnUrl,
          cancel_url: paypalConfig.cancelUrl
        }
      });

      const order = await paypalClient.execute(request);

      return {
        success: true,
        order_id: order.result.id,
        approval_url: order.result.links.find(link => link.rel === 'approve').href
      };
    } catch (error) {
      if (paypalConfig.debugMode) {
        console.error('PayPal Order Creation Error:', error);
      }
      return {
        success: false,
        error: error.message
      };
    }
  }

  async captureOrder(order_id) {
    try {
      const request = new paypal.orders.OrdersCaptureRequest(order_id);
      const capture = await paypalClient.execute(request);

      return {
        success: true,
        status: capture.result.status,
        transaction_id: capture.result.purchase_units[0].payments.captures[0].id,
        amount: parseFloat(capture.result.purchase_units[0].payments.captures[0].amount.value) * 100
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ============= SUBSCRIPTIONS =============

  async createSubscription(plan_id, user_id, user_email, user_name) {
    try {
      const request = new paypal.subscriptions.SubscriptionsCreateRequest();
      request.requestBody({
        plan_id: plan_id,
        subscriber: {
          email_address: user_email,
          name: {
            given_name: user_name.first_name || 'User',
            surname: user_name.last_name || 'Name'
          }
        },
        application_context: {
          ...paypalConfig.subscriptionDefaults.application_context,
          return_url: paypalConfig.subscriptionReturnUrl,
          cancel_url: paypalConfig.subscriptionCancelUrl
        },
        custom_id: user_id
      });

      const subscription = await paypalClient.execute(request);

      return {
        success: true,
        subscription_id: subscription.result.id,
        approval_url: subscription.result.links.find(link => link.rel === 'approve').href
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
      const request = new paypal.subscriptions.SubscriptionsCancelRequest(subscription_id);
      request.requestBody({
        reason: 'User requested cancellation'
      });

      await paypalClient.execute(request);

      return {
        success: true,
        message: 'Subscription cancelled successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ============= PAYOUTS (For Landlords) =============

  async createPayout(recipient_email, amount, note) {
    try {
      const request = new paypal.payouts.PayoutsPostRequest();
      request.requestBody({
        sender_batch_header: {
          ...paypalConfig.payoutDefaults.sender_batch_header,
          sender_batch_id: `moveinn_payout_${Date.now()}`
        },
        items: [{
          ...paypalConfig.payoutDefaults.item_defaults,
          amount: {
            value: (amount / 100).toFixed(2),
            currency: paypalConfig.payoutDefaults.item_defaults.currency
          },
          receiver: recipient_email,
          note: note
        }]
      });

      const payout = await paypalClient.execute(request);

      return {
        success: true,
        batch_id: payout.result.batch_header.payout_batch_id
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export const paypalService = new PayPalService();