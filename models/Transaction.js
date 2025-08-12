// models/Transaction.js

import mongoose from "mongoose";
import { TRANSACTION_TYPES, TRANSACTION_STATUS } from "../utils/enums.js";


const transactionSchema = new mongoose.Schema(
  {
    transaction_type: {
      type: String,
      enum: Object.values(TRANSACTION_TYPES),
      required: true
    },
    
    payer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    payee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // For platform fees
    },
    
    amount: {
      type: Number,
      required: true // Amount in cents
    },
    
    platform_fee: {
      type: Number,
      default: 0 // Moveinn commission in cents
    },
    
    gateway_fee: {
      type: Number,
      default: 0 // Stripe/PayPal processing fees in cents
    },
    
    net_amount: {
      type: Number,
      required: true // Amount after all fees in cents
    },
    
    currency: {
      type: String,
      default: 'usd'
    },
    
    gateway: {
      type: String,
      enum: ['stripe', 'paypal'],
      required: true
    },
    
    stripe_payment_intent_id: String,
    paypal_payment_id: String,
    
    status: {
      type: String,
      enum: Object.values(TRANSACTION_STATUS),
      default: TRANSACTION_STATUS.PENDING
    },
    
    escrow_hold_until: Date, // For rent payments only
    escrow_released: {
      type: Boolean,
      default: false // For rent payments only
    },
    
    metadata: {
      subscription_id: mongoose.Schema.Types.ObjectId, // For subscriptions
      billing_period_start: Date, // For subscriptions
      billing_period_end: Date, // For subscriptions
      
      listing_id: mongoose.Schema.Types.ObjectId, // For listings
      property_id: mongoose.Schema.Types.ObjectId, // For listings
      listing_type: String, // 'basic', 'premium'
      boost_expires_at: Date, // For listing boosts
      
      check_type: String, // 'background', 'income_employment', 'social_credit'
      certn_order_id: String, // For background checks
      
      contract_id: mongoose.Schema.Types.ObjectId, // For contracts
      
      rent_period_start: Date, // For rent payments
      rent_period_end: Date, // For rent payments
      
      company_name: String // For partnerships
    },
    description: {
      type: String,
    },
    receipt_url: String,
    refund_amount: {
      type: Number,
      default: 0 // Refund amount in cents
    },
    refunded_at: Date,
    failure_reason: String, // For failed transactions
  },
  { timestamps: true }
);
// Essential indexes
transactionSchema.index({ payer_id: 1 });
transactionSchema.index({ payee_id: 1 });
transactionSchema.index({ transaction_type: 1, status: 1 });
transactionSchema.index({ createdAt: -1 }); // For recent transactions
transactionSchema.index({ metadata: 1 }); // For flexible metadata queries
transactionSchema.index({ amount: 1, currency: 1 }); // For financial queries
transactionSchema.index({ escrow_hold_until: 1 }); // For rent payment escrows
transactionSchema.index({ status: 1, createdAt: -1 }); // For transaction status history
transactionSchema.index({ stripe_payment_intent_id: 1 }, { unique: true });
transactionSchema.index({ paypal_payment_id: 1 }, { unique: true });

export const Transaction = mongoose.model('Transaction', transactionSchema);
