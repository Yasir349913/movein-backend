// config/index.js

import { env } from './env.config.js';
export { env } from "./env.config.js";
export { openai, openaiConfig, getModelForAge } from "./openai.config.js";
export { s3, awsConfig, generateS3Key, getPublicUrl } from "./aws.config.js";
export { redis, redisConfig } from "./redis.config.js";
export { transporter, emailConfig } from "./email.config.js";
export { connectDB } from "./db.config.js";
export { stripe, stripeConfig } from './stripe.config.js';
export { paypalClient, paypalEnvironment, paypalConfig } from './paypal.config.js';

// General payment configuration using env.js
export const paymentConfig = {
  // Default gateway priority
  defaultGateway: 'stripe',

  // Gateway availability
  enabledGateways: {
    stripe: !!env.STRIPE_SECRET_KEY,
    paypal: !!env.PAYPAL_CLIENT_ID
  },

  // Currency settings
  defaultCurrency: 'usd',
  supportedCurrencies: ['usd', 'cad'],

  // Environment
  environment: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',

  // URLs
  clientUrl: env.CLIENT_URL,
  apiBaseUrl: env.API_BASE_URL,

  // Webhook endpoints
  webhookEndpoints: {
    stripe: '/api/webhooks/stripe',
    paypal: '/api/webhooks/paypal'
  },

  // Platform fees and settings
  platformFeePercentage: env.PLATFORM_FEE_PERCENTAGE,
  escrowHoldDays: env.ESCROW_HOLD_DAYS,

  // University settings
  defaultUniversityFee: env.DEFAULT_UNIVERSITY_FEE,
  defaultStudentDiscount: env.DEFAULT_STUDENT_DISCOUNT,

  // Timeout settings
  requestTimeout: 10000, // 10 seconds

  // Retry settings
  maxRetries: 3,
  retryDelay: 1000, // 1 second

  // Security
  enableWebhookVerification: !env.DEBUG_WEBHOOKS,
  corsOrigin: env.CORS_ORIGIN,

  // Debug and Mock settings
  debugMode: env.DEBUG_PAYMENTS,
  mockStripePayments: env.MOCK_STRIPE_PAYMENTS,
  mockPaypalPayments: env.MOCK_PAYPAL_PAYMENTS || false,

  // Logging
  enableLogging: env.NODE_ENV !== 'production',
  logLevel: env.LOG_LEVEL
};