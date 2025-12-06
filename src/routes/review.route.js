import express from "express";
import * as reviewController from "../controllers/review.controller.js";
import { authMiddleware } from "../middlewares/authentication.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { reviewSchema } from "../validators/review.validator.js";

const router = express.Router();

// ==================== REVIEW ROUTES ====================

/**
 * Get all reviews (optionally filtered by tour)
 * GET /api/reviews?tour=:tourId
 */
router.get("/", reviewController.getReviews);

/**
 * Create a new review
 * POST /api/reviews
 */
router.post(
  "/",
  authMiddleware,
  validateBody(reviewSchema),
  reviewController.createReview
);

/**
 * Update a review
 * PATCH /api/reviews/:id
 */
router.patch(
  "/:id",
  authMiddleware,
  validateBody(reviewSchema.partial()),
  reviewController.updateReview
);

/**
 * Delete a review
 * DELETE /api/reviews/:id
 */
router.delete("/:id", authMiddleware, reviewController.deleteReview);

export default router;
