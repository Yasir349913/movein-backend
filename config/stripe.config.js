// config/stripe.config.js
import Stripe from 'stripe';
import { env } from './env.config.js';

if (!env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required in environment variables');
}

if (!env.STRIPE_PUBLISHABLE_KEY) {
  throw new Error('STRIPE_PUBLISHABLE_KEY is required in environment variables');
}

// Initialize Stripe instance
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Use latest stable API version
});

// Stripe configuration constants
export const stripeConfig = {
  secretKey: env.STRIPE_SECRET_KEY,
  publishableKey: env.STRIPE_PUBLISHABLE_KEY,
  webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  connectClientId: env.STRIPE_CONNECT_CLIENT_ID,

  // API Configuration
  apiVersion: '2023-10-16',
  maxNetworkRetries: 3,
  timeout: 10000, // 10 seconds

  // Application Settings
  applicationInfo: {
    name: 'Moveinn',
    version: '1.0.0',
    url: env.CLIENT_URL
  },

  // Default Currency
  defaultCurrency: 'usd',

  // Connect Account Settings
  connectAccountType: 'express',
  connectCountry: 'US',

  // Return URLs for Connect onboarding
  connectReturnUrl: `${env.CLIENT_URL}/dashboard/payment-setup?success=true`,
  connectRefreshUrl: `${env.CLIENT_URL}/dashboard/payment-setup?refresh=true`,

  // Platform Fee
  platformFeePercentage: env.PLATFORM_FEE_PERCENTAGE / 100, // Convert to decimal

  // Escrow Settings
  escrowHoldDays: env.ESCROW_HOLD_DAYS,

  // Payment Intent Settings
  paymentIntentDefaults: {
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true
    }
  },

  // Subscription Settings
  subscriptionDefaults: {
    collection_method: 'charge_automatically',
    billing_cycle_anchor: 'now'
  },

  // Debug Settings
  debugMode: env.DEBUG_PAYMENTS,
  mockPayments: env.MOCK_STRIPE_PAYMENTS
};