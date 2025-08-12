import mongoose from "mongoose";
import { PAYOUT_STATUS, ACCOUNT_TYPES } from "../utils/enums.js";



const payoutSchema = new mongoose.Schema(
  {
    landlord_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    gross_amount: {
      type: Number,
      required: true // Total collected in cents
    },
    
    platform_fee: {
      type: Number,
      default: 0 // Moveinn commission in cents
    },
    
    gateway_fee: {
      type: Number,
      default: 0 // Processing fee in cents
    },
    
    net_payout: {
      type: Number,
      required: true // Actual payout amount in cents
    },
    
    currency: {
      type: String,
      default: 'usd'
    },
    
    gateway: {
      type: String,
      enum: Object.values(ACCOUNT_TYPES),
      required: true
    },
    
    stripe_transfer_id: String,
    paypal_batch_id: String,
    
    status: {
      type: String,
      enum: Object.values(PAYOUT_STATUS),
      default: PAYOUT_STATUS.PENDING
    },
    
    transaction_ids: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    }],
    
    payout_period_start: Date,
    payout_period_end: Date,
    
    scheduled_payout_date: Date,
    actual_payout_date: Date,
    
    failure_reason: String
  },
  { timestamps: true }
);

export const Payout = mongoose.model('Payout', payoutSchema);