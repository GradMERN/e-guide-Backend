import express from "express";
import { authMiddleware } from "../middlewares/authentication.middleware.js";
import {
  confirmPayment,
  initializePayment,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/initialize/:enrollmentId", authMiddleware, initializePayment);

router.post("/confirm/:sessionId", confirmPayment);

export default router;
