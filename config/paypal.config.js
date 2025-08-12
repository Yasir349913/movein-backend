// config/paypal.config.js
import paypal from '@paypal/checkout-server-sdk';
import { env } from './env.config.js';

// Environment setup
const isProduction = env.NODE_ENV === 'production';

export const paypalEnvironment = isProduction
  ? new paypal.core.LiveEnvironment(env.PAYPAL_CLIENT_ID, env.PAYPAL_CLIENT_SECRET)
  : new paypal.core.SandboxEnvironment(env.PAYPAL_CLIENT_ID, env.PAYPAL_CLIENT_SECRET);

// Initialize PayPal client
export const paypalClient = new paypal.core.PayPalHttpClient(paypalEnvironment);

// PayPal configuration constants
export const paypalConfig = {
  clientId: env.PAYPAL_CLIENT_ID,
  clientSecret: env.PAYPAL_CLIENT_SECRET,
  webhookId: env.PAYPAL_WEBHOOK_ID,

  // Environment
  environment: isProduction ? 'live' : 'sandbox',
  isProduction: isProduction,

  // API Configuration
  timeout: 10000, // 10 seconds
  maxRetries: 3,

  // Application Settings
  brandName: 'Moveinn',
  locale: 'en-US',

  // Return URLs
  returnUrl: `${env.CLIENT_URL}/payment/paypal/success`,
  cancelUrl: `${env.CLIENT_URL}/payment/paypal/cancel`,

  // Subscription Return URLs
  subscriptionReturnUrl: `${env.CLIENT_URL}/subscription/paypal/success`,
  subscriptionCancelUrl: `${env.CLIENT_URL}/subscription/paypal/cancel`,

  // Order Settings
  orderDefaults: {
    intent: 'CAPTURE',
    application_context: {
      brand_name: 'Moveinn',
      locale: 'en-US',
      landing_page: 'BILLING',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'PAY_NOW'
    }
  },

  // Subscription Settings
  subscriptionDefaults: {
    application_context: {
      brand_name: 'Moveinn',
      locale: 'en-US',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'SUBSCRIBE_NOW',
      payment_method: {
        payer_selected: 'PAYPAL',
        payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
      }
    }
  },

  // Product Settings for Subscriptions
  productDefaults: {
    type: 'SERVICE',
    category: 'SOFTWARE',
    image_url: `${env.CLIENT_URL}/logo.png`,
    home_url: env.CLIENT_URL
  },

  // Payout Settings
  payoutDefaults: {
    sender_batch_header: {
      email_subject: 'You have a payment from Moveinn',
      email_message: 'You have received a payment from Moveinn.'
    },
    item_defaults: {
      recipient_type: 'EMAIL',
      currency: 'USD'
    }
  },

  // Debug Settings
  debugMode: env.DEBUG_PAYMENTS,
  mockPayments: env.MOCK_PAYPAL_PAYMENTS
};