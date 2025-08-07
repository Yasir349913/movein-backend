// models/User.js - Minimal fixes to your existing model
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { USER_TYPES, USER_STATUS, USER_GENDER } from "../utils/enums.js";

const userSchema = new mongoose.Schema(
  {
    // Basic Information - Keep as-is
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    // SIMPLIFIED: Use only user_type (remove redundant 'role' field)
    user_type: {
      type: String,
      enum: USER_TYPES,
      default: "tenant" // Changed from "user" to "tenant"
    },

    // Keep all your existing auth fields
    password: { type: String, required: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // Keep your existing profile fields
    profile_img: { type: String, default: null },
    status: { type: String, enum: USER_STATUS, default: "pending" },
    phone: { type: String, default: null },
    isSubscribed: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },

    // ENHANCED: Better verification badges structure
    verificationBadges: {
      background_check: { type: Boolean, default: false },
      income_check: { type: Boolean, default: false },
      social_credit: { type: Boolean, default: false },
      identity_verification: { type: Boolean, default: false }
    },

    // ADD: Essential fields for onboarding flow
    date_of_birth: { type: Date },
    gender: {
      type: String,
      enum: USER_GENDER
    },
    occupation: { type: String },
    language_preference: {
      type: String,
      enum: ['english', 'chinese'],
      default: 'english'
    },

    // ADD: University association (for students)
    university_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'University',
      default: null
    },

    company_info: {
      company_name: { type: String },
      business_type: { type: String },
      company_size: { type: String },
      website: { type: String },
      tax_id: { type: String },
      business_address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        zip_code: { type: String },
        country: { type: String, default: 'USA' }
      }
    },

    // ADD: Simple activity tracking
    last_login: { type: Date },
    is_active: { type: Boolean, default: true }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.resetPasswordToken;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.resetPasswordToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Keep all your existing methods but update for user_type
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
      user_type: this.user_type, // Changed from 'role'
      role: this.user_type, // Keep for backward compatibility
    },
    env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: env.ACCESS_TOKEN_EXPIRY || "15m",
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id },
    env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: env.REFRESH_TOKEN_EXPIRY || "7d",
    }
  );
};

userSchema.methods.generateEmailVerificationToken = function () {
  const token = jwt.sign(
    { _id: this._id, email: this.email },
    env.EMAIL_VERIFICATION_SECRET,
    { expiresIn: "24h" }
  );
  this.emailVerificationToken = token;
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return token;
};

// ADD: Helper methods for user types
userSchema.methods.isAdmin = function () {
  return ['admin', 'super_admin'].includes(this.user_type);
};

userSchema.methods.isSuperAdmin = function () {
  return this.user_type === 'super_admin';
};

userSchema.methods.isBusinessUser = function () {
  return ['landlord', 'agency', 'university_admin', 'bank_partner'].includes(this.user_type);
};

userSchema.methods.canAccessRoommateFinder = function () {
  return this.user_type === 'tenant';
};

// Keep your existing pre-save middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ user_type: 1 }); // Add index for user_type

export const User = mongoose.model("User", userSchema);