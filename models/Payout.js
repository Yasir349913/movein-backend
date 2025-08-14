import mongoose from "mongoose";
import { PAYOUT_STATUS, ACCOUNT_TYPES } from "../utils/enums.js";


const payoutSchema = new mongoose.Schema({
  landlord_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  payout_batch_id: {
    type: String,
    unique: true
  },
  
  // Amounts (in cents)
  gross_amount: {
    type: Number,
    required: true
  },
  platform_fee: {
    type: Number,
    required: true
  },
  gateway_fee: {
    type: Number,
    required: true
  },
  net_payout: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'usd'
  },
  
  // Gateway info
  gateway: {
    type: String,
    enum: Object.values(ACCOUNT_TYPES),
    required: true
  },
  stripe_transfer_id: String,
  paypal_batch_id: String,
  
  // Status
  status: {
    type: String,
    enum: Object.values(PAYOUT_STATUS),
    default: 'pending'
  },
  
  // Related transactions
  transaction_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }],
  
  // Period
  payout_period_start: Date,
  payout_period_end: Date,
  
  // Timing
  scheduled_payout_date: Date,
  actual_payout_date: Date,
  
  // Error handling
  failure_code: String,
  failure_message: String,
  retry_count: {
    type: Number,
    default: 0
  },
  next_retry_date: Date
}, {
  timestamps: true
});

payoutSchema.index({ landlord_id: 1, status: 1 });
payoutSchema.index({ scheduled_payout_date: 1, status: 1 });

export const Payout = mongoose.model('Payout', payoutSchema);
