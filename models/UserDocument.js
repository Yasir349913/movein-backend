// models/UserDocument.js
import mongoose from "mongoose";
import { DOCUMENT_TYPE, DOCUMENT_STATUS } from "../utils/enums.js";


const userDocumentSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // Document info
    document_type: {
      type: String,
      enum: DOCUMENT_TYPE,
      required: true
    },
    document_name: {
      type: String,
      required: true,
      trim: true
    },
    
    // File info
    file_url: {
      type: String,
      required: true
    },
    file_size: {
      type: Number,
      required: true
    },
    file_type: {
      type: String,
      required: true
    },
    
    // Status
    status: {
      type: String,
      enum: DOCUMENT_STATUS,
      default: 'pending'
    },
    
    // Review
    reviewed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewed_at: {
      type: Date
    },
    review_notes: {
      type: String
    },
    
    is_active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Essential indexes
userDocumentSchema.index({ user_id: 1, document_type: 1 });
userDocumentSchema.index({ status: 1 });

// Essential methods
userDocumentSchema.methods.approve = function(adminId, notes = '') {
  this.status = 'approved';
  this.reviewed_by = adminId;
  this.reviewed_at = new Date();
  this.review_notes = notes;
  return this.save();
};

userDocumentSchema.methods.reject = function(adminId, reason) {
  this.status = 'rejected';
  this.reviewed_by = adminId;
  this.reviewed_at = new Date();
  this.review_notes = reason;
  return this.save();
};

userDocumentSchema.statics.findByUser = function(userId) {
  return this.find({
    user_id: userId,
    is_active: true
  }).sort({ createdAt: -1 });
};

export const UserDocument = mongoose.model("UserDocument", userDocumentSchema);