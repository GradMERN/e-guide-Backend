import express from "express";
import {
  enrollTour,
  getUserEnrollments,
  stripeWebhookHandler as enrollmentStripeWebhook,
} from "../controllers/enrollment.controller.js";
import { authMiddleware } from "../middlewares/authentication.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/:tourId/enroll", enrollTour);

router.get("/", getUserEnrollments);

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  enrollmentStripeWebhook
);

export default router;
