import express from "express";
import {
  enrollTour,
  getUserEnrollments,
  stripeWebhookHandler as enrollmentStripeWebhook,
  startEnrollment,
} from "../controllers/enrollment.controller.js";
import { authMiddleware } from "../middlewares/authentication.middleware.js";

const router = express.Router();

// Stripe webhook route - must be BEFORE authMiddleware to work correctly
// Note: The raw body parsing is handled in app.js before JSON parsing
router.post("/webhook", enrollmentStripeWebhook);

// Protected routes - require authentication
router.use(authMiddleware);

router.post("/:tourId/enroll", enrollTour);

router.get("/", getUserEnrollments);

// Start an active enrollment
router.post("/:enrollmentId/start", startEnrollment);

export default router;
