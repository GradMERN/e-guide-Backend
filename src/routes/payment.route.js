import express from "express";
import { authMiddleware } from "../middlewares/authentication.middleware.js";
import {
  confirmPayment,
  initializePayment,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/initialize/:enrollmentId", authMiddleware, initializePayment);

// Confirm payment - requires auth to verify user owns the payment
router.post("/confirm/:sessionId", authMiddleware, confirmPayment);

export default router;
