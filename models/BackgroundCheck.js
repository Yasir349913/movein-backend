// models/BackgroundCheck.js
import mongoose from "mongoose";

export const CHECK_TYPE = [
  'background',
  'income_employment',
  'social_credit'
];
export const CHECK_STATUS = [
  'pending',
  'in_progress',
  'completed',
  'failed'
];
export const BADGE_TYPE = [
  'background_verified',
  'income_verified',
  'social_credit_verified'
];


const backgroundCheckSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // Check details
    check_type: {
      type: String,
      enum: CHECK_TYPE,
      required: true
    },
    amount_paid: {
      type: Number,
      required: true
    },
    
    // Certn integration
    certn_order_id: {
      type: String
    },
    
    // Status
    status: {
      type: String,
      enum: CHECK_STATUS,
      default: 'pending'
    },
    overall_result: {
      type: String,
      enum: ['pass', 'fail', 'pending']
    },
    
    // Badge
    badge_awarded: {
      type: Boolean,
      default: false
    },
    badge_type: {
      type: String
    },
    
    // Simple results storage
    results: {
      type: mongoose.Schema.Types.Mixed
    },
    
    completed_at: {
      type: Date
    }
  },
  { timestamps: true }
);

// Essential indexes
backgroundCheckSchema.index({ user_id: 1, check_type: 1 });
backgroundCheckSchema.index({ status: 1 });

// Essential methods
backgroundCheckSchema.methods.markCompleted = function(results, passed = true) {
  this.status = 'completed';
  this.completed_at = new Date();
  this.overall_result = passed ? 'pass' : 'fail';
  this.results = results;
  
  if (passed) {
    this.badge_awarded = true;
    this.badge_type = `${this.check_type}_verified`;
  }
  
  return this.save();
};

backgroundCheckSchema.statics.getChecksPricing = function() {
  return {
    'background': 24.99,
    'income_employment': 38.99,
    'social_credit': 21.99
  };
};

export const BackgroundCheck = mongoose.model("BackgroundCheck", backgroundCheckSchema);