// models/PaymentAccount.js

import mongoose from "mongoose";
import { ACCOUNT_TYPES, ACCOUNT_STATUS, KYC_STATUS } from "../utils/enums.js";


const paymentAccountSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    
    account_type: {
      type: String,
      enum: Object.values(ACCOUNT_TYPES),
      required: true
    },
    
    // Stripe Integration
    stripe_account_id: String,
    stripe_customer_id: String,
    
    // PayPal Integration
    paypal_email: String,
    paypal_merchant_id: String,
    
    // Account Status
    account_status: {
      type: String,
      enum: Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.PENDING
    },
    
    kyc_status: {
      type: String,
      enum: Object.values(KYC_STATUS),
      default: KYC_STATUS.PENDING
    },
    
    payout_enabled: {
      type: Boolean,
      default: false
    },
    
    // Account Details (minimal)
    account_details: {
      business_type: String, // 'individual', 'company'
      country: String, // 'US'
      currency: String // 'usd'
    },
    
    // Error Handling
    rejection_reason: String,
    
  },
  { timestamps: true }
);
// Add indexes for better performance
paymentAccountSchema.index({ user_id: 1 }, { unique: true });
// Add a compound index for account type and status
paymentAccountSchema.index({ account_type: 1, account_status: 1 });


export const PaymentAccount = mongoose.model('PaymentAccount', paymentAccountSchema);

