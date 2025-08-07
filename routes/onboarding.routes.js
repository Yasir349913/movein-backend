// routes/onboarding.routes.js
import { Router } from "express";
import { onboardingController } from "../controllers/index.js";
import { validate, auth, upload } from "../middlewares/index.js";

const router = Router();

// All onboarding routes require authentication
router.use(auth);

// Progress tracking
router.get("/progress", onboardingController.getProgress);

// Basic profile setup
router.post("/profile-setup", validate.setupBasicProfile, onboardingController.setupBasicProfile);

// Profile image upload
router.post("/upload-profile-image", upload.single('profile_image'), validate.uploadProfileImage, onboardingController.uploadProfileImage);

// University verification (for students)
router.post("/university-verification", validate.verifyUniversityStudent, onboardingController.verifyUniversityStudent);

// Identity document upload (for landlords/agencies)
router.post("/upload-document", upload.single('document'), validate.uploadIdentityDocument, onboardingController.uploadIdentityDocument);

// Background check services
router.post("/background-check", validate.orderBackgroundCheck, onboardingController.orderBackgroundCheck);
router.get("/background-check/pricing", onboardingController.getBackgroundCheckPricing);

// Company verification (for agencies)
router.post("/company-verification", validate.setupCompanyVerification, onboardingController.setupCompanyVerification);
router.post("/upload-business-document", upload.single('document'), validate.uploadBusinessDocument, onboardingController.uploadBusinessDocument);

// University Onboarding (New)
router.get("/university-dashboard", onboardingController.getUniversityDashboard);
router.post("/upload-university-logo", upload.single('logo'), onboardingController.uploadUniversityLogo);
router.post("/setup-university-profile", validate.createUniversity ,onboardingController.setupUniversityProfile);

// Complete onboarding
router.post("/complete", onboardingController.completeOnboarding);

// Skip optional steps
router.post("/skip-step", onboardingController.skipStep);

// Retry failed steps
router.post("/retry-step", onboardingController.retryStep);

export default router;