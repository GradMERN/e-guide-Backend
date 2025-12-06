import Review from "../models/review.model.js";
import Tour from "../models/tour.model.js";
import asyncHandler from "../utils/async-error-wrapper.utils.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { reviewSchema } from "../validators/review.validator.js";
import Enrollment from "../models/enrollment.model.js";

// ==================== REVIEW CRUD ====================

/**
 * Get all reviews for a tour
 * GET /api/reviews?tour=:tourId
 */
export const getReviews = asyncHandler(async (req, res) => {
  const { tour } = req.query;

  let filter = {};
  if (tour) {
    filter.tour = tour;
  }

  const reviews = await Review.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: reviews.length,
    data: reviews,
  });
});

/**
 * Get reviews for a specific tour
 * GET /api/tours/:tourId/reviews
 */
export const getTourReviews = asyncHandler(async (req, res) => {
  const { tourId } = req.params;

  const reviews = await Review.find({ tour: tourId }).sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: reviews.length,
    data: reviews,
  });
});

/**
 * Create a new review
 * POST /api/reviews
 */
export const createReview = asyncHandler(async (req, res) => {
  const { tour, rating, comment } = req.body;
  const userId = req.user._id;

  // Check if user has an active enrollment for this tour
  const enrollment = await Enrollment.findOne({
    user: userId,
    tour: tour,
    status: "started",
    $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
  });

  // Allow guides to review their own tours
  const tourDoc = await Review.findOne({ _id: tour }).populate("guide");
  const isGuide = tourDoc && tourDoc.guide._id.toString() === userId.toString();

  if (!enrollment && !isGuide) {
    return res.status(403).json({
      status: "error",
      message:
        "You must have an active enrollment for this tour to leave a review, or be the tour guide",
    });
  }

  const review = await Review.create({
    tour,
    user: userId,
    rating,
    comment,
  });

  res.status(201).json({
    status: "success",
    data: review,
  });
});

/**
 * Update a review
 * PATCH /api/reviews/:id
 */
export const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user._id;

  const review = await Review.findOneAndUpdate(
    { _id: id, user: userId },
    { rating, comment },
    { new: true, runValidators: true }
  );

  if (!review) {
    return res.status(404).json({
      status: "error",
      message: "Review not found or you don't have permission to update it",
    });
  }

  res.status(200).json({
    status: "success",
    data: review,
  });
});

/**
 * Create a review for a specific tour
 * POST /api/tours/:tourId/reviews
 */
export const createReviewForTour = asyncHandler(async (req, res) => {
  const { tourId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user._id;

  // Check if user has an active enrollment for this tour
  const enrollment = await Enrollment.findOne({
    user: userId,
    tour: tourId,
    status: "started",
    $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
  });

  // Allow guides to review their own tours
  const tourDoc = await Tour.findById(tourId);
  const isGuide = tourDoc && tourDoc.guide.toString() === userId.toString();

  if (!enrollment && !isGuide) {
    return res.status(403).json({
      status: "error",
      message:
        "You must have an active enrollment for this tour to leave a review, or be the tour guide",
    });
  }

  const review = await Review.create({
    tour: tourId,
    user: userId,
    rating,
    comment,
  });

  res.status(201).json({
    status: "success",
    data: review,
  });
});

/**
 * Delete a review
 * DELETE /api/reviews/:id
 */
export const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const review = await Review.findOneAndDelete({ _id: id, user: userId });

  if (!review) {
    return res.status(404).json({
      status: "error",
      message: "Review not found or you don't have permission to delete it",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Review deleted successfully",
  });
});
