// routes/index.js
import { Router } from "express";
import authRoutes from "./auth.routes.js";
import onboardingRoutes from "./onboarding.routes.js";
import paymentRoutes from "./payment.routes.js";
import payoutRoutes from "./payout.routes.js";
import webhookRoutes from "./webhook.routes.js";

// Main router for the application
const router = Router();

router.use("/auth", authRoutes);
router.use("/onboarding", onboardingRoutes);
router.use("/payment", paymentRoutes);
router.use("/payout", payoutRoutes);
router.use("/webhook", webhookRoutes);

// Add documentation or other routes as needed
router.get("/", (req, res) => {
  res.send("Welcome to the Moveinn Rental API");
});
export default router;
