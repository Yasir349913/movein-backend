// utils/paymentEnum.js

// ============= PAYMENT GATEWAYS =============
export const PAYMENT_GATEWAYS = {
  STRIPE: 'stripe',
  PAYPAL: 'paypal'
};

// ============= SERVICE PRICING (in cents) =============
export const SERVICE_PRICING = {
  // Background Checks
  BACKGROUND_CHECK: 2499,        // $24.99
  INCOME_CHECK: 3899,            // $38.99
  SOCIAL_CREDIT_CHECK: 2199,     // $21.99
  
  // Listing Services
  BASIC_LISTING: 1999,           // $19.99
  PREMIUM_LISTING: 4999,         // $49.99
  LISTING_BOOST: 999,            // $9.99
  
  // Digital Services
  CONTRACT_FEE: 799,             // $7.99
  
  // Subscriptions
  ROOMMATE_WEEKLY: 599,          // $5.99
  LANDLORD_MONTHLY: 999,         // $9.99
  AGENCY_MONTHLY: 29900,         // $299.00
  UNIVERSITY_MONTHLY: 9900,      // $99.00
  BANK_AD_MONTHLY: 49900         // $499.00
};

// ============= PLATFORM FEES =============
export const PLATFORM_FEES = {
  RENT_COMMISSION: 0.03,         // 3%
  STRIPE_PERCENTAGE: 0.029,      // 2.9%
  STRIPE_FIXED_FEE: 30,          // 30 cents
  PAYPAL_PERCENTAGE: 0.0349,     // 3.49%
  PAYPAL_FIXED_FEE: 49           // 49 cents
};

// ============= CHECK TYPES =============
export const CHECK_TYPES = {
  BACKGROUND: 'background',
  INCOME_EMPLOYMENT: 'income_employment',
  SOCIAL_CREDIT: 'social_credit'
};

// ============= LISTING TYPES =============
export const LISTING_TYPES = {
  BASIC: 'basic',
  PREMIUM: 'premium'
};

// ============= SERVICE CATEGORIES =============
export const SERVICE_CATEGORIES = {
  VERIFICATION: 'verification',
  LISTING: 'listing',
  SUBSCRIPTION: 'subscription',
  CONTRACT: 'contract',
  RENTAL: 'rental'
};

// ============= BILLING INTERVALS =============
export const BILLING_INTERVALS = {
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
  ONE_TIME: 'one_time'
};

// ============= ESCROW SETTINGS =============
export const ESCROW_SETTINGS = {
  HOLD_PERIOD_DAYS: 7,           // 7 days hold for rent payments
  DISPUTE_WINDOW_DAYS: 14        // 14 days dispute window
};

// ============= WEBHOOK EVENTS =============
export const WEBHOOK_EVENTS = {
  STRIPE: {
    PAYMENT_SUCCEEDED: 'payment_intent.succeeded',
    PAYMENT_FAILED: 'payment_intent.payment_failed',
    SUBSCRIPTION_CREATED: 'customer.subscription.created',
    SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
    SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
    INVOICE_PAID: 'invoice.payment_succeeded',
    INVOICE_FAILED: 'invoice.payment_failed',
    ACCOUNT_UPDATED: 'account.updated',
    TRANSFER_CREATED: 'transfer.created',
    PAYOUT_PAID: 'payout.paid',
    PAYOUT_FAILED: 'payout.failed'
  },
  PAYPAL: {
    PAYMENT_COMPLETED: 'PAYMENT.CAPTURE.COMPLETED',
    PAYMENT_DENIED: 'PAYMENT.CAPTURE.DENIED',
    SUBSCRIPTION_ACTIVATED: 'BILLING.SUBSCRIPTION.ACTIVATED',
    SUBSCRIPTION_CANCELLED: 'BILLING.SUBSCRIPTION.CANCELLED',
    SUBSCRIPTION_SUSPENDED: 'BILLING.SUBSCRIPTION.SUSPENDED',
    SUBSCRIPTION_PAYMENT_FAILED: 'BILLING.SUBSCRIPTION.PAYMENT.FAILED',
    PAYOUT_COMPLETED: 'PAYOUTS.PAYOUTSBATCH.SUCCESS',
    PAYOUT_DENIED: 'PAYOUTS.PAYOUTSBATCH.DENIED'
  }
};

// ============= CURRENCY =============
export const CURRENCY = {
  USD: 'usd',
  CAD: 'cad',
  EUR: 'eur'
};

// ============= SERVICE DESCRIPTIONS =============
export const SERVICE_DESCRIPTIONS = {
  BACKGROUND_CHECK: 'Background Check - Identity & Criminal Record Verification',
  INCOME_CHECK: 'Income/Employment Verification Check',
  SOCIAL_CREDIT_CHECK: 'Social Credit Score Report',
  BASIC_LISTING: 'Basic Property Listing - 30 Days',
  PREMIUM_LISTING: 'Premium Property Listing - 60 Days',
  LISTING_BOOST: 'Listing Visibility Boost - 7 Days',
  CONTRACT_FEE: 'Digital Contract Generation & Signing',
  ROOMMATE_WEEKLY: 'Roommate Finder Weekly Subscription',
  LANDLORD_MONTHLY: 'Landlord Monthly Subscription',
  AGENCY_MONTHLY: 'Agency Unlimited Package',
  UNIVERSITY_MONTHLY: 'University Partnership Program',
  BANK_AD_MONTHLY: 'Bank Advertisement Package'
};

// ============= TRIAL PERIODS (in days) =============
export const TRIAL_PERIODS = {
  UNIVERSITY_TRIAL: 30,          // 30 days free trial for universities
  AGENCY_TRIAL: 7,               // 7 days free trial for agencies
  ROOMMATE_TRIAL: 0              // No trial for roommate finder
};

// ============= SUBSCRIPTION LIMITS =============
export const SUBSCRIPTION_LIMITS = {
  AGENCY_SUB_ACCOUNTS: 5,        // Max 5 sub-accounts for agencies
  UNIVERSITY_DISCOUNT: 15,       // 15% discount for students
  LISTING_BASIC_DAYS: 30,        // Basic listing duration
  LISTING_PREMIUM_DAYS: 60,      // Premium listing duration
  BOOST_DURATION_DAYS: 7         // Listing boost duration
};