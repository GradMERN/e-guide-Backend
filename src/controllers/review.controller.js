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

  const reviews = await Review.find(filter)
    .populate("user", "firstName lastName email avatar")
    .sort({ createdAt: -1 });

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

  const reviews = await Review.find({ tour: tourId })
    .populate("user", "firstName lastName email avatar")
    .sort({ createdAt: -1 });

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

  // Check if user has an active or started enrollment for this tour
  const enrollment = await Enrollment.findOne({
    user: userId,
    tour: tour,
    status: { $in: ["active", "started"] },
    $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
  });

  // Allow guides to review their own tours
  const tourDoc = await Tour.findById(tour);
  const isGuide =
    tourDoc && tourDoc.guide && tourDoc.guide.toString() === userId.toString();

  if (!enrollment && !isGuide) {
    return res.status(403).json({
      status: "error",
      message:
        "You must have an active enrollment for this tour to leave a review, or be the tour guide",
    });
  }

  // Check if user already has a review for this tour
  const existingReview = await Review.findOne({ tour, user: userId });
  if (existingReview) {
    return res.status(400).json({
      status: "error",
      message: "You have already reviewed this tour",
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

  // Check if user has an active or started enrollment for this tour
  const enrollment = await Enrollment.findOne({
    user: userId,
    tour: tourId,
    status: { $in: ["active", "started"] },
    $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
  });

  // Allow guides to review their own tours
  const tourDoc = await Tour.findById(tourId);
  if (!tourDoc) {
    return res.status(404).json({
      status: "error",
      message: "Tour not found",
    });
  }

  const isGuide =
    tourDoc.guide && tourDoc.guide.toString() === userId.toString();

  if (!enrollment && !isGuide) {
    return res.status(403).json({
      status: "error",
      message:
        "You must have an active enrollment for this tour to leave a review, or be the tour guide",
    });
  }

  // Check if user already has a review for this tour
  const existingReview = await Review.findOne({ tour: tourId, user: userId });
  if (existingReview) {
    return res.status(400).json({
      status: "error",
      message: "You have already reviewed this tour",
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
