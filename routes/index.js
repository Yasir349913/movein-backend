// routes/index.js
import { Router } from "express";
import authRoutes from "./auth.routes.js";
import onboardingRoutes from "./onboarding.routes.js";

// Main router for the application
const router = Router();

router.use("/auth", authRoutes);
router.use("/onboarding", onboardingRoutes);

// Add documentation or other routes as needed
router.get("/", (req, res) => {
  res.send("Welcome to the Moveinn Rental API");
});
router.get("/docs", (req, res) => {
  res.send("API Documentation will be available here soon.");
  
});
export default router;
