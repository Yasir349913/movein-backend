// config/env.js
import dotenv from "dotenv";
dotenv.config();

// Validate required variables for Moveinn
const requiredEnvVars = [
 // Core Application
 "NODE_ENV",
 "PORT",
 "MONGODB_URI",
 "CLIENT_URL",

 // Authentication
 "ACCESS_TOKEN_SECRET",
 "REFRESH_TOKEN_SECRET",
 "EMAIL_VERIFICATION_SECRET",

 // Email Service
 "SMTP_HOST",
 "SMTP_USER",
 "SMTP_PASS",

 // File Storage
 "AWS_ACCESS_KEY_ID",
 "AWS_SECRET_ACCESS_KEY",
 "AWS_S3_BUCKET",
 "AWS_REGION",

 // Payment Processing - Stripe
 "STRIPE_SECRET_KEY",
 "STRIPE_PUBLISHABLE_KEY",
 "STRIPE_WEBHOOK_SECRET",

 // Payment Processing - PayPal
 "PAYPAL_CLIENT_ID",
 "PAYPAL_CLIENT_SECRET",
 "PAYPAL_WEBHOOK_ID",

 // Background Checks
 "CERTN_API_KEY",

 // Google Maps
 "GOOGLE_MAPS_API_KEY"
];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`⚠️  Missing required env variable: ${key}`);
  }
});

export const env = {
  // ==========================================
  // SERVER CONFIGURATION
  // ==========================================
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  API_BASE_URL: process.env.API_BASE_URL || "http://localhost:5000/api",

  // ==========================================
  // DATABASE
  // ==========================================
  MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URI,
  DB_NAME: process.env.DB_NAME || "moveinn",

  // ==========================================
  // JWT AUTHENTICATION
  // ==========================================
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  EMAIL_VERIFICATION_SECRET: process.env.EMAIL_VERIFICATION_SECRET,
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || "15m",
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || "7d",

  // ==========================================
  // EMAIL CONFIGURATION
  // ==========================================
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  FROM_EMAIL: process.env.FROM_EMAIL || process.env.SMTP_USER,
  FROM_NAME: process.env.FROM_NAME || "Moveinn",
  EMAIL_MAX_RETRIES: parseInt(process.env.EMAIL_MAX_RETRIES) || 3,
  EMAIL_RETRY_DELAY: parseInt(process.env.EMAIL_RETRY_DELAY) || 5000,

  // ==========================================
  // FILE STORAGE (AWS S3)
  // ==========================================
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
  AWS_REGION: process.env.AWS_REGION || "us-east-1",
  S3_BASE_URL: process.env.S3_BASE_URL || `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com`,

  // ==========================================
  // BACKGROUND CHECK API (CERTN)
  // ==========================================
  CERTN_API_URL: process.env.CERTN_API_URL || "https://sandbox-api.certn.co",
  CERTN_API_KEY: process.env.CERTN_API_KEY,
  CERTN_CLIENT_ID: process.env.CERTN_CLIENT_ID,
  CERTN_CLIENT_SECRET: process.env.CERTN_CLIENT_SECRET,
  CERTN_WEBHOOK_SECRET: process.env.CERTN_WEBHOOK_SECRET,
  BACKGROUND_CHECK_WEBHOOK_URL: process.env.BACKGROUND_CHECK_WEBHOOK_URL,


  // ==========================================
  // PAYMENT PROCESSING (STRIPE & PAYPAL)
  // ==========================================
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_CONNECT_CLIENT_ID: process.env.STRIPE_CONNECT_CLIENT_ID,// ==========================================
  // PAYMENT PROCESSING (STRIPE & PAYPAL)
  // ==========================================
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_CONNECT_CLIENT_ID: process.env.STRIPE_CONNECT_CLIENT_ID,

  // PayPal Configuration
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
  PAYPAL_WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID,
  PAYPAL_WEBHOOK_SECRET: process.env.PAYPAL_WEBHOOK_SECRET,

  // Platform Settings
  PLATFORM_FEE_PERCENTAGE: parseFloat(process.env.PLATFORM_FEE_PERCENTAGE) || 5.0,
  ESCROW_HOLD_DAYS: parseInt(process.env.ESCROW_HOLD_DAYS) || 7,

  // Development PayPal Settings
  MOCK_PAYPAL_PAYMENTS: process.env.MOCK_PAYPAL_PAYMENTS === "true",

  // ==========================================
  // GOOGLE MAPS API
  // ==========================================
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  GOOGLE_GEOCODING_API_KEY: process.env.GOOGLE_GEOCODING_API_KEY || process.env.GOOGLE_MAPS_API_KEY,

  // ==========================================
  // ADMIN CREDENTIALS
  // ==========================================
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "admin@moveinn.com",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "Admin123!",
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL || "superadmin@moveinn.com",
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin123!",

  // ==========================================
  // UNIVERSITY PARTNERSHIPS
  // ==========================================
  DEFAULT_UNIVERSITY_FEE: parseFloat(process.env.DEFAULT_UNIVERSITY_FEE) || 99.00,
  DEFAULT_STUDENT_DISCOUNT: parseFloat(process.env.DEFAULT_STUDENT_DISCOUNT) || 15.0,

  // ==========================================
  // SECURITY SETTINGS
  // ==========================================
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  MAX_PROFILE_IMAGE_SIZE: parseInt(process.env.MAX_PROFILE_IMAGE_SIZE) || 5 * 1024 * 1024, // 5MB
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
  COOKIE_SECRET: process.env.COOKIE_SECRET || "moveinn-cookie-secret",
  FORCE_HTTPS: process.env.FORCE_HTTPS === "true",
  SECURE_COOKIES: process.env.SECURE_COOKIES === "true",

  // ==========================================
  // REDIS (OPTIONAL)
  // ==========================================
  REDIS_URL: process.env.REDIS_URL,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  CACHE_TTL: parseInt(process.env.CACHE_TTL) || 3600,

  // ==========================================
  // EXTERNAL SERVICES (OPTIONAL)
  // ==========================================
  // SMS Service (Twilio)
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,

  // Push Notifications (FCM)
  FCM_SERVER_KEY: process.env.FCM_SERVER_KEY,
  FCM_PROJECT_ID: process.env.FCM_PROJECT_ID,

  // ==========================================
  // LOGGING & MONITORING
  // ==========================================
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  SENTRY_DSN: process.env.SENTRY_DSN,
  LOGROCKET_APP_ID: process.env.LOGROCKET_APP_ID,

  // ==========================================
  // DEVELOPMENT SETTINGS
  // ==========================================
  MOCK_CERTN_API: process.env.MOCK_CERTN_API === "true",
  MOCK_STRIPE_PAYMENTS: process.env.MOCK_STRIPE_PAYMENTS === "true",
  MOCK_EMAIL_SENDING: process.env.MOCK_EMAIL_SENDING === "true",
  DEBUG_WEBHOOKS: process.env.DEBUG_WEBHOOKS === "true",
  DEBUG_PAYMENTS: process.env.DEBUG_PAYMENTS === "true",
  DEBUG_BACKGROUND_CHECKS: process.env.DEBUG_BACKGROUND_CHECKS === "true",

  // ==========================================
  // PRODUCTION SETTINGS
  // ==========================================
  PRIMARY_DOMAIN: process.env.PRIMARY_DOMAIN || "moveinn.com",
  API_DOMAIN: process.env.API_DOMAIN || "api.moveinn.com",
  CDN_URL: process.env.CDN_URL,

  // ==========================================
  // BACKUP & MAINTENANCE
  // ==========================================
  DB_BACKUP_FREQUENCY: process.env.DB_BACKUP_FREQUENCY || "daily",
  DB_BACKUP_RETENTION_DAYS: parseInt(process.env.DB_BACKUP_RETENTION_DAYS) || 30,
  MAINTENANCE_MODE: process.env.MAINTENANCE_MODE === "true",
  MAINTENANCE_MESSAGE: process.env.MAINTENANCE_MESSAGE || "We're currently performing maintenance. Please try again later.",

  // ==========================================
  // ANALYTICS & TRACKING (OPTIONAL)
  // ==========================================
  GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID,
  MIXPANEL_TOKEN: process.env.MIXPANEL_TOKEN,
  HOTJAR_ID: process.env.HOTJAR_ID,


  // File Upload (legacy)
  UPLOAD_PATH: process.env.UPLOAD_PATH || "./uploads"
};