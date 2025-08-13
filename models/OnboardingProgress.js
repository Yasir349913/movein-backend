// models/OnboardingProgress.js
import mongoose from "mongoose";
import { USER_TYPES } from "../utils/enums.js";

const onboardingProgressSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    
    // Basic progress tracking
    user_type: {
      type: String,
      enum: USER_TYPES,
      required: true
    },
    current_step: {
      type: String,
      default: 'email_verification'
    },
    completion_percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    
    // Simple step tracking
    steps_completed: [{
      step_name: String,
      completed_at: { type: Date, default: Date.now }
    }],
    steps_required: [String],
    
    // Status
    is_completed: {
      type: Boolean,
      default: false
    },
    completed_at: {
      type: Date
    },
    
    // Basic analytics
    started_at: {
      type: Date,
      default: Date.now
    },
    last_activity_at: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Essential indexes
onboardingProgressSchema.index({ user_type: 1, is_completed: 1 });

// Essential methods
onboardingProgressSchema.methods.completeStep = function(stepName) {
  // Add to completed steps if not already there
  const alreadyCompleted = this.steps_completed.some(step => step.step_name === stepName);
  if (!alreadyCompleted) {
    this.steps_completed.push({ step_name: stepName });
  }
  
  // Update progress
  this.completion_percentage = Math.round(
    (this.steps_completed.length / this.steps_required.length) * 100
  );
  
  // Check if fully completed
  if (this.completion_percentage === 100) {
    this.is_completed = true;
    this.completed_at = new Date();
    this.current_step = 'completed';
  } else {
    // Move to next step logic (simplified)
    this.moveToNextStep();
  }
  
  this.last_activity_at = new Date();
  return this.save();
};

onboardingProgressSchema.methods.moveToNextStep = function() {
  const stepFlows = {
    'tenant': ['email_verification', 'basic_profile', 'profile_image'],
    'landlord': ['email_verification', 'basic_profile', 'identity_verification', 'payment_setup'],
    'agency': ['email_verification', 'basic_profile', 'company_verification', 'subscription_setup'],
    'university_admin': ['email_verification', 'basic_profile', 'university_setup'],
    'bank_partner': ['email_verification', 'basic_profile', 'company_verification']
  };
  
  const flow = stepFlows[this.user_type] || stepFlows['tenant'];
  const completedStepNames = this.steps_completed.map(s => s.step_name);
  
  // Find next incomplete step
  for (const step of flow) {
    if (!completedStepNames.includes(step)) {
      this.current_step = step;
      break;
    }
  }
  
  return this;
};

onboardingProgressSchema.statics.initializeForUser = function(userId, userType) {
  const stepFlows = {
    'tenant': ['email_verification', 'basic_profile', 'profile_image'],
    'landlord': ['email_verification', 'basic_profile', 'identity_verification', 'payment_setup'],
    'agency': ['email_verification', 'basic_profile', 'company_verification', 'subscription_setup'],
    'university_admin': ['email_verification', 'basic_profile', 'university_setup'],
    'bank_partner': ['email_verification', 'basic_profile', 'company_verification']
  };
  
  return this.create({
    user_id: userId,
    user_type: userType,
    steps_required: stepFlows[userType] || stepFlows['tenant'],
    current_step: 'email_verification'
  });
};

export const OnboardingProgress = mongoose.model("OnboardingProgress", onboardingProgressSchema);