// controllers/auth.controller.js
import { User } from "../models/index.js";
import { emailService, onboardingService } from "../services/index.js";
import { logger, ApiResponse, ApiError } from "../utils/index.js";
import jwt from "jsonwebtoken";
import { env } from "../config/index.js";


// User registration
export const register = async (req, res) => {
  const { name, email, password, user_type, phone, language_preference } = req.body;
  
  logger.info("User registration attempt", { email, user_type });
  
  try {
    const result = await onboardingService.registerUser({
      name, 
      email, 
      password, 
      user_type, 
      phone, 
      language_preference
    });
    
    res.status(201).json(
      new ApiResponse(201, {
        user: {
          id: result.user._id,
          name: result.user.name,
          email: result.user.email,
          user_type: result.user.user_type,
          isEmailVerified: result.user.isEmailVerified,
        },
        onboarding: {
          next_step: result.next_step,
          completion_percentage: 0,
          requires_onboarding: true
        }
      }, "Registration successful. Please check your email for verification.")
    );
  } catch (error) {
    logger.error("Registration failed", { email, error: error.message });
    throw new ApiError(400, error.message);
  }
};

// Email verification
export const verifyEmail = async (req, res) => {
  const { token } = req.params;
  
  logger.info("Email verification attempt", { token: token.substring(0, 10) + "..." });
  
  try {
    const result = await onboardingService.verifyEmail(token);
    
    // Set secure cookies
    const cookieOptions = {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    
    res.cookie("refreshToken", result.refreshToken, cookieOptions);
    res.cookie("accessToken", result.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    
    logger.info("Email verified successfully", { userId: result.user._id });
    
    res.status(200).json(
      new ApiResponse(200, {
        user: {
          id: result.user._id,
          name: result.user.name,
          email: result.user.email,
          user_type: result.user.user_type,
          isEmailVerified: result.user.isEmailVerified,
        },
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        onboarding: {
          next_step: result.next_step,
          completion_percentage: result.completion_percentage,
          requires_onboarding: !result.user.isVerified
        }
      }, "Email verified successfully")
    );
  } catch (error) {
    logger.error("Email verification failed", { error: error.message });
    throw new ApiError(400, error.message);
  }
};

// User login
export const login = async (req, res) => {
  const { email, password } = req.body;
  
  logger.info("User login attempt", { email });
  
  // Find user by email
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }
  
  // Check password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }
  
  // Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  
  // Set secure cookies
  const cookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  
  res.cookie("refreshToken", refreshToken, cookieOptions);
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  
  logger.info("User logged in successfully", { userId: user._id, email });
  
  res.status(200).json(
    new ApiResponse(200, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        role: user.user_type,
      },
      accessToken,
      refreshToken,
    }, "Login successful")
  );
};

// User logout
export const logout = async (req, res) => {
  // Clear cookies
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  
  logger.info("User logged out successfully");
  
  res.status(200).json(
    new ApiResponse(200, null, "Logout successful")
  );
};

// Refresh access token
export const refreshToken = async (req, res) => {
  const { refreshToken } = req.cookies || req.body;
  
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }
  
  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }
  
  // Find user
  const user = await User.findById(decoded._id);
  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }
  
  // Generate new access token
  const newAccessToken = user.generateAccessToken();
  
  // Set new access token cookie
  res.cookie("accessToken", newAccessToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  
  logger.info("Access token refreshed", { userId: user._id });
  
  res.status(200).json(
    new ApiResponse(200, {
      accessToken: newAccessToken,
    }, "Token refreshed successfully")
  );
};


// Resend verification email
export const resendVerification = async (req, res) => {
  const { email } = req.body;
  
  logger.info("Resend verification attempt", { email });
  
  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  
  if (user.isEmailVerified) {
    throw new ApiError(400, "Email is already verified");
  }
  
  // Generate new verification token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save();
  
  // Send verification email
  await emailService.sendEmailVerification(email, verificationToken, { userName: user.name });
  
  logger.info("Verification email resent", { userId: user._id, email });
  
  res.status(200).json(
    new ApiResponse(200, null, "Verification email sent successfully")
  );
};

// Forgot password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  
  logger.info("Forgot password attempt", { email });
  
  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if email exists
    return res.status(200).json(
      new ApiResponse(200, null, "If the email exists, a reset link has been sent")
    );
  }
  
  // Generate reset token
  const resetToken = jwt.sign(
    { _id: user._id, email: user.email },
    env.EMAIL_VERIFICATION_SECRET,
    { expiresIn: "1h" }
  );
  
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();
  
  // Send reset email (implement in email service)
  await emailService.sendPasswordResetEmail(email, resetToken, { userName: user.name });
  
  logger.info("Password reset email sent", { userId: user._id, email });
  
  res.status(200).json(
    new ApiResponse(200, null, "If the email exists, a reset link has been sent")
  );
};

// Reset password
export const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  
  if (!token || !password) {
    throw new ApiError(400, "Token and password are required");
  }
  
  // Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, env.EMAIL_VERIFICATION_SECRET);
  } catch (error) {
    throw new ApiError(400, "Invalid or expired reset token");
  }
  
  // Find user and update password
  const user = await User.findOneAndUpdate(
    {
      _id: decoded._id,
      email: decoded.email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    },
    {
      $set: { password },
      $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 }
    },
    { new: true }
  );
  
  if (!user) {
    throw new ApiError(400, "Invalid or expired reset token");
  }
  
  logger.info("Password reset successfully", { userId: user._id, email: user.email });
  
  res.status(200).json(
    new ApiResponse(200, null, "Password reset successfully")
  );
};

// Get user profile
export const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  
  res.status(200).json(
    new ApiResponse(200, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
    }, "Profile retrieved successfully")
  );
};