// routes/auth.routes.js
import { Router } from "express";
import { authController } from "../controllers/index.js";
import { validate } from "../middlewares/index.js";

const router = Router();

// Authentication routes
router.post("/register", validate.registerUser, authController.register);
router.post("/login", validate.loginUser, authController.login);
router.post("/logout", authController.logout);
router.post("/refresh-token", authController.refreshToken);

// Email verification
router.get("/verify-email/:token", authController.verifyEmail);
router.post("/resend-verification", validate.resendVerification, authController.resendVerification);

// Password reset
router.post("/forgot-password", validate.forgotPassword, authController.forgotPassword);
router.post("/reset-password", validate.resetPassword, authController.resetPassword);

// Profile
router.get("/profile", authController.getProfile);

export default router;