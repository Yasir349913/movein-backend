// routes/payment.routes.js
import { Router } from "express";
import { paymentController } from "../controllers/index.js";
import { validate, auth } from "../middlewares/index.js";

const router = Router();

// ============= PRICING INFORMATION =============
// Get service pricing (public route - no auth needed)
router.get("/pricing", paymentController.getServicePricing);

// All payment routes require authentication
router.use(auth);

// ============= ONE-TIME PAYMENTS =============

// Create one-time payment (background checks, listing fees, contracts)
router.post("/one-time", validate.createOneTimePayment, paymentController.createOneTimePayment);

// Confirm one-time payment
router.post("/one-time/confirm", validate.confirmOneTimePayment, paymentController.confirmOneTimePayment);

// ============= SUBSCRIPTIONS =============

// Create subscription (roommate, agency, university, bank)
router.post("/subscription", validate.createSubscription, paymentController.createSubscription);

// Cancel subscription
router.patch("/subscription/:subscription_id/cancel", paymentController.cancelSubscription);

// Get subscription status
router.get("/subscription/:subscription_id", paymentController.getSubscriptionStatus);

// ============= PAYMENT ACCOUNT SETUP =============

// Setup payment account (for landlords)
router.post("/account/setup", validate.setupPaymentAccount, paymentController.setupPaymentAccount);

// Get payment account status
router.get("/account/status", paymentController.getPaymentAccountStatus);

// ============= RENT PAYMENTS =============

// Create rent payment (tenant to landlord)
router.post("/rent", validate.createRentPayment, paymentController.createRentPayment);

// ============= TRANSACTION HISTORY =============

// Get transaction history
router.get("/transactions", paymentController.getTransactionHistory);

// Get specific transaction
router.get("/transactions/:transaction_id", paymentController.getTransaction);





export default router;