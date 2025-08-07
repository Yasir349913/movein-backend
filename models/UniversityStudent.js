// models/UniversityStudent.js
import mongoose from "mongoose";

const universityStudentSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    university_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'University',
      required: true
    },
    
    // Student info
    student_email: {
      type: String,
      required: true,
      lowercase: true
    },
    student_id: {
      type: String,
      trim: true
    },
    major: {
      type: String,
      trim: true
    },
    graduation_year: {
      type: Number
    },
    
    // Verification
    is_verified: {
      type: Boolean,
      default: false
    },
    verification_method: {
      type: String,
      enum: ['email_domain', 'manual_approval'],
      default: 'email_domain'
    },
    
    // Discount
    discount_eligible: {
      type: Boolean,
      default: false
    },
    
    is_active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Essential indexes
universityStudentSchema.index({ user_id: 1, university_id: 1 }, { unique: true });
universityStudentSchema.index({ student_email: 1 });

// Essential methods
universityStudentSchema.methods.verify = function() {
  this.is_verified = true;
  this.discount_eligible = true;
  return this.save();
};

universityStudentSchema.methods.applyDiscount = function(originalAmount) {
  if (!this.discount_eligible) return originalAmount;
  
  const discountAmount = (originalAmount * 15) / 100; // 15% discount
  return originalAmount - discountAmount;
};

export const UniversityStudent = mongoose.model("UniversityStudent", universityStudentSchema);
