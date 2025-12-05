import express from "express";
import {
  enrollTour,
  getUserEnrollments,
  stripeWebhookHandler as enrollmentStripeWebhook,
  startEnrollment,
} from "../controllers/enrollment.controller.js";
import { authMiddleware } from "../middlewares/authentication.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/:tourId/enroll", enrollTour);

router.get("/", getUserEnrollments);

// Start an active enrollment
router.post("/:enrollmentId/start", startEnrollment);

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  enrollmentStripeWebhook
);

export default router;
