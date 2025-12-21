import express from "express";
import {
  enrollTour,
  getUserEnrollments,
  stripeWebhookHandler as enrollmentStripeWebhook,
  startEnrollment,
} from "../controllers/enrollment.controller.js";
import { authMiddleware } from "../middlewares/authentication.middleware.js";

const router = express.Router();

router.post("/webhook", enrollmentStripeWebhook);

router.use(authMiddleware);

router.post("/:tourId/enroll", enrollTour);

router.get("/", getUserEnrollments);

router.post("/:enrollmentId/start", startEnrollment);

export default router;
