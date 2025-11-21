import express from "express";
import {
  enrollTour,
  getUserEnrollments,
} from "../controllers/enrollment.controller.js";
import { authMiddleware } from "../middlewares/authentication.middleware.js";

const router = express.Router();

router.use(authMiddleware);

// Enroll in a tour
router.post("/:tourId/enroll", enrollTour);

// Get current user's enrollments
router.get("/", getUserEnrollments);

export default router;
