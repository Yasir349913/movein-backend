// models/University.js
import mongoose from "mongoose";

const universitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    domain: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    admin_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    contact_email: {
      type: String,
      required: true,
      lowercase: true
    },
    
    // Subscription
    subscription_status: {
      type: String,
      enum: ['active', 'inactive', 'trial'],
      default: 'trial'
    },
    monthly_fee: {
      type: Number,
      default: 99.00
    },
    discount_percentage: {
      type: Number,
      default: 15.00
    },
    
    // Simple tracking
    total_students: {
      type: Number,
      default: 0
    },
    is_active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Essential indexes
universitySchema.index({ domain: 1 });
universitySchema.index({ admin_user_id: 1 });

// Essential methods
universitySchema.methods.isValidStudentEmail = function(email) {
  const emailDomain = email.split('@')[1];
  return emailDomain === this.domain;
};

universitySchema.statics.findByDomain = function(domain) {
  return this.findOne({ 
    domain: domain.toLowerCase(),
    is_active: true,
    subscription_status: { $in: ['active', 'trial'] }
  });
};

export const University = mongoose.model("University", universitySchema);