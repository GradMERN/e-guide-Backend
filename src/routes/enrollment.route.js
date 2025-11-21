import express from "express";
import {
  enrollTour,
  getUserEnrollments,
} from "../controllers/enrollment.controller.js";
import { authMiddleware } from "../middlewares/authentication.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { enrollmentSchema } from "../validators/enrollment.validator.js";

const router = express.Router();

router.use(authMiddleware);

// Enroll in a tour
router.post("/:tourId/enroll", validateBody(enrollmentSchema), enrollTour);

// Get current user's enrollments
router.get("/", getUserEnrollments);

export default router;
