// models/Subscription.js
// {
//   // Subscription Identity
//   user_id: ObjectId, // Subscriber
//   subscription_type: String,
//   // 'landlord_monthly', 'roommate_weekly', 'agency_unlimited', 
//   // 'university_partnership', 'bank_advertisement'
  
//   // Pricing
//   amount: Number, // In cents (999, 599, 29900, 9900, 49900)
//   currency: String, // 'usd'
//   billing_interval: String, // 'week', 'month'
  
//   // Stripe Integration
//   stripe_subscription_id: String,
//   stripe_customer_id: String,
//   stripe_price_id: String,
  
//   // Subscription Status
//   status: String,
//   // 'trialing', 'active', 'past_due', 'canceled', 'unpaid'
  
//   // Billing Cycle
//   current_period_start: Date,
//   current_period_end: Date,
  
//   // Trial Management
//   trial_start: Date,
//   trial_end: Date,
  
//   // Type-Specific Data (flexible JSON)
//   subscription_data: {
//     // For landlord: property_id, activated_when_rented
//     // For roommate: expires_at, auto_renew, features_locked_at  
//     // For agency: company_name, max_sub_accounts, current_sub_accounts
//     // For university: university_id, institution_name, student_discount_percentage
//     // For bank: company_name, campaign_ids
//   },
  
//   // Lifecycle
//   activated_at: Date,
//   canceled_at: Date,
//   cancel_at_period_end: Boolean,
  
//   created_at: Date,
//   updated_at: Date
// }


import mongoose from "mongoose";
import { SUBSCRIPTION_TYPES, SUBSCRIPTION_STATUS, SUBSCRIPTION_BILLING_INTERVAL } from "../utils/enums.js";

const subscriptionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    subscription_type: {
      type: String,
      enum: SUBSCRIPTION_TYPES,
      required: true
    },
    
    amount: {
      type: Number,
      required: true
    },
    
    currency: {
      type: String,
      default: 'usd'
    },
    
    billing_interval: {
      type: String,
      enum: SUBSCRIPTION_BILLING_INTERVAL,
      required: true
    },
    
    stripe_subscription_id: String,
    stripe_customer_id: String,
    stripe_price_id: String,
    
    status: {
      type: String,
      enum: SUBSCRIPTION_STATUS,
      default: 'trialing'
    },
    
    current_period_start: Date,
    current_period_end: Date,
    
    trial_start: Date,
    trial_end: Date,
    
    subscription_data: mongoose.Schema.Types.Mixed, // Flexible JSON for type-specific data
    
    activated_at: Date,
    canceled_at: Date,
    
    cancel_at_period_end: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)
// Add indexes for performance
subscriptionSchema.index({ user_id: 1, subscription_type: 1 }, { unique: true });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ current_period_end: 1 });
subscriptionSchema.index({ trial_end: 1 });
subscriptionSchema.index({ canceled_at: 1 });
subscriptionSchema.index({ activated_at: 1 });


export const Subscription = mongoose.model('Subscription', subscriptionSchema);