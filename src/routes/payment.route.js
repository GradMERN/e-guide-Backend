import express from "express";
import { authMiddleware } from "../middlewares/authentication.middleware.js";
import {
  createPaymentIntent,
  stripeWebhookHandler,
} from "../controllers/payment.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { paymentSchema } from "../validators/payment.validator.js";

const router = express.Router();

// Create PaymentIntent for an enrollment
router.post(
  "/create/:enrollmentId",
  authMiddleware,
  validateBody(paymentSchema),
  createPaymentIntent
);

// Stripe webhook (no auth, raw body for signature verification)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookHandler
);

export default router;
