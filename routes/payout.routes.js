// routes/payout.routes.js
import { Router } from "express";
import { payoutController } from "../controllers/index.js";
import { auth } from "../middlewares/index.js";

const router = Router();

// All routes require authentication
router.use(auth);

// Landlord payout endpoints
router.get('/summary', payoutController.getPayoutSummary);
router.get('/history', payoutController.getPayoutHistory);

// Admin endpoints (add admin middleware)
router.post('/process-pending', payoutController.processPendingPayouts);
router.post('/retry-failed', payoutController.retryFailedPayouts);

export default router;