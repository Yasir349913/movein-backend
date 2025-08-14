
export const WEBHOOK_EVENT_TYPES = {
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_INTENT_FAILED: 'payment_intent.failed',
  CUSTOMER_SUBSCRIPTION_CREATED: 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  CHARGE_SUCCEEDED: 'charge.succeeded',
  CHARGE_FAILED: 'charge.failed',
  INVOICE_CREATED: 'invoice.created',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  ACCOUNT_UPDATED: 'account.updated',
  ACCOUNT_APPLICATION_DELETED: 'account.application.deleted',
  ACCOUNT_APPLICATION_APPROVED: 'account.application.approved',
  ACCOUNT_APPLICATION_REJECTED: 'account.application.rejected',
  TRANSFER_CREATED: 'transfer.created',
  TRANSFER_FAILED: 'transfer.failed',
  TRANSFER_SUCCEEDED: 'transfer.succeeded',
  PAYOUT_CREATED: 'payout.created',
  PAYOUT_FAILED: 'payout.failed',
  PAYOUT_SUCCEEDED: 'payout.succeeded',
  WEBHOOK_ERROR: 'webhook.error'
};


export const WEBHOOK_GATEWAYS = {
  STRIPE: 'stripe',
  PAYPAL: 'paypal'
};

export const PAYOUT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  IN_TRANSIT: 'in_transit',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELED: 'canceled',
  PAID: 'paid',

};




export const PLAN_TYPES = {
  SUBSCRIPTION: 'subscription',
  ONE_TIME: 'one_time',
  FREE: 'free'
};

export const ACCOUNT_TYPES = {
  STRIPE_CONNECT: 'stripe_connect',
  PAYPAL: 'paypal'
};

export const ACCOUNT_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  RESTRICTED: 'restricted',
  SUSPENDED: 'suspended'
};

export const KYC_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  UNDER_REVIEW: 'under_review'
};

export const SUBSCRIPTION_TYPES = {
  LANDLORD_MONTHLY: 'landlord_monthly',
  ROOMMATE_WEEKLY: 'roommate_weekly',
  AGENCY_UNLIMITED: 'agency_unlimited',
  UNIVERSITY_PARTNERSHIP: 'university_partnership',
  BANK_ADVERTISEMENT: 'bank_advertisement'
};

export const SUBSCRIPTION_STATUS = {
  TRIALING: 'trialing',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  UNPAID: 'unpaid'
};

export const SUBSCRIPTION_BILLING_INTERVAL = {
  WEEK: 'week',
  MONTH: 'month'
};

export const TRANSACTION_TYPES = {
  LANDLORD_SUBSCRIPTION: 'landlord_subscription',
  ROOMMATE_SUBSCRIPTION: 'roommate_subscription',
  LISTING_FEE: 'listing_fee',
  LISTING_BOOST: 'listing_boost',
  CONTRACT_FEE: 'contract_fee',
  BACKGROUND_CHECK: 'background_check',
  AGENCY_SUBSCRIPTION: 'agency_subscription',
  UNIVERSITY_SUBSCRIPTION: 'university_subscription',
  BANK_AD_SUBSCRIPTION: 'bank_ad_subscription',
  RENT_PAYMENT: 'rent_payment'
};

export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  DISPUTED: 'disputed'
};

export const USER_TYPES = {
  TENANT: 'tenant',
  LANDLORD: 'landlord',
  AGENCY: 'agency',
  UNIVERSITY_ADMIN: 'university_admin',
  BANK_PARTNER: 'bank_partner',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

export const USER_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  BANNED: 'banned'
};

export const USER_GENDER = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
  PREFER_NOT_TO_SAY: 'prefer_not_to_say'
};

export const DOCUMENT_TYPE = {
  IDENTITY_CARD: 'identity_card',
  PASSPORT: 'passport',
  DRIVERS_LICENSE: 'drivers_license',
  STUDENT_ID: 'student_id',
  BANK_STATEMENT: 'bank_statement',
  PAY_STUB: 'pay_stub',
  OTHER: 'other'
};

export const DOCUMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};


export const CHECK_TYPE = {
  BACKGROUND: 'background',
  INCOME_EMPLOYMENT: 'income_employment',
  SOCIAL_CREDIT: 'social_credit'
};


export const CHECK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

export const BADGE_TYPE = {
  BACKGROUND_VERIFIED: 'background_verified',
  INCOME_VERIFIED: 'income_verified',
  SOCIAL_CREDIT_VERIFIED: 'social_credit_verified'
};
