// models/PaymentPlan.js

import mongoose from "mongoose";
import { SUBSCRIPTION_BILLING_INTERVAL, PLAN_TYPES } from "../utils/enums.js";



const paymentPlanSchema = new mongoose.Schema(
  {
    plan_id: {
      type: String,
      required: true,
    },
    
    plan_name: {
      type: String,
      required: true
    },
    
    plan_type: {
      type: String,
      enum: Object.values(PLAN_TYPES),
      required: true
    },
    
    amount: {
      type: Number,
      required: true // In cents
    },
    
    currency: {
      type: String,
      default: 'usd'
    },
    
    billing_interval: {
      type: String,
      enum: Object.values(SUBSCRIPTION_BILLING_INTERVAL),
      default: SUBSCRIPTION_BILLING_INTERVAL.MONTH
    },
    
    stripe_price_id: String,
    stripe_product_id: String,
    
    features: [String], // e.g., ['messaging', 'contracts', 'analytics']
    
    description: String,
    
    limits: {
      duration_days: Number, // e.g., 30, 60 for listings
      sub_accounts: Number, // e.g., 5 for agencies
      trial_days: Number // e.g., 30 for universities
    },
    
    is_active: {
      type: Boolean,
      default: true
    },
    
    display_order: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
)

// Add indexes for performance
paymentPlanSchema.index({ plan_id: 1 }, { unique: true });
paymentPlanSchema.index({ plan_type: 1 });
paymentPlanSchema.index({ is_active: 1 });


export const PaymentPlan = mongoose.model('PaymentPlan', paymentPlanSchema);