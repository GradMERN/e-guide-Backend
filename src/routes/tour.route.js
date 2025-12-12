import express from "express";
import * as tourController from "../controllers/tour.controller.js";
import * as reviewController from "../controllers/review.controller.js";
import {
  authMiddleware,
  authorize,
} from "../middlewares/authentication.middleware.js";
import { ROLES } from "../utils/roles.utils.js";
import * as tourValidator from "../validators/tour.validator.js";
import {
  reviewSchema,
  createReviewSchema,
} from "../validators/review.validator.js";
import { upload } from "../utils/upload.util.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import tourItemRoutes from "./tourItem.route.js";
const router = express.Router();

// ==================== TOUR ROUTES ====================

/**
 * Get all published tours with filtering
 * GET /api/tours
 */
router.get("/", tourController.getTours);

/**
 * Get guide's all tours (draft and published)
 * GET /api/tours/my-tours
 */
router.get(
  "/my-tours",
  authMiddleware,
  authorize(ROLES.GUIDE, ROLES.ADMIN),
  tourController.getGuideTours
);

/**
 * Get guide's dashboard statistics
 * GET /api/tours/guide-stats
 */
router.get(
  "/guide-stats",
  authMiddleware,
  authorize(ROLES.GUIDE, ROLES.ADMIN),
  tourController.getGuideStats
);

/**
 * Get guide's analytics
 * GET /api/tours/guide-analytics
 */
router.get(
  "/guide-analytics",
  authMiddleware,
  authorize(ROLES.GUIDE, ROLES.ADMIN),
  tourController.getGuideAnalytics
);

/**
 * Get reviews for guide's tours
 * GET /api/tours/my-reviews
 */
router.get(
  "/my-reviews",
  authMiddleware,
  authorize(ROLES.GUIDE, ROLES.ADMIN),
  tourController.getGuideReviews
);

/**
 * Get single tour by ID
 * GET /api/tours/:id
 */
router.get("/:id", tourController.getTour);

/**
 * Create new tour (draft mode)
 * POST /api/tours
 */
router.post(
  "/",
  authMiddleware,
  authorize(ROLES.GUIDE, ROLES.ADMIN),
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "galleryImages", maxCount: 10 },
  ]),
  validateBody(tourValidator.createTourSchema),
  tourController.createTour
);

/**
 * Update tour details
 * PATCH /api/tours/:id
 */
router.patch(
  "/:id",
  authMiddleware,
  authorize(ROLES.GUIDE, ROLES.ADMIN),
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "galleryImages", maxCount: 10 },
  ]),
  validateBody(tourValidator.updateTourSchema),
  tourController.updateTour
);

/**
 * Publish tour (make visible to users)
 * PUT /api/tours/:id/publish
 */
router.put(
  "/:id/publish",
  authMiddleware,
  authorize(ROLES.GUIDE, ROLES.ADMIN),
  tourController.publishTour
);

/**
 * Delete tour (cascade deletes all items and images)
 * DELETE /api/tours/:id
 */
router.delete(
  "/:id",
  authMiddleware,
  authorize(ROLES.GUIDE, ROLES.ADMIN),
  tourController.deleteTour
);

/**
 * Delete gallery image from tour
 * DELETE /api/tours/:id/gallery-image
 */
router.delete(
  "/:id/gallery-image",
  authMiddleware,
  authorize(ROLES.GUIDE, ROLES.ADMIN),
  tourController.deleteGalleryImage
);
router.use("/:tourId/items", tourItemRoutes);

// ==================== REVIEW ROUTES ====================

/**
 * Get reviews for a specific tour
 * GET /api/tours/:tourId/reviews
 */
router.get("/:tourId/reviews", reviewController.getTourReviews);

/**
 * Create a review for a tour
 * POST /api/tours/:tourId/reviews
 */
router.post(
  "/:tourId/reviews",
  authMiddleware,
  validateBody(createReviewSchema),
  reviewController.createReviewForTour
);

// // ==================== TOUR ITEMS (WAYPOINTS) ROUTES ====================

// /**
//  * Create tour item (waypoint)
//  * POST /api/tours/:tourId/items
//  */
// router.post(
//   "/:tourId/items",
//   authMiddleware,
//   authorize(ROLES.GUIDE, ROLES.ADMIN),
//   validateBody(tourValidator.createTourItemSchema),
//   tourController.createTourItem
// );

// /**
//  * Get all waypoints in a tour
//  * GET /api/tours/:tourId/items
//  */
// router.get("/:tourId/items", tourController.getTourItems);

// /**
//  * Get single waypoint
//  * GET /api/tours/:tourId/items/:itemId
//  */
// router.get("/:tourId/items/:itemId", tourController.getTourItem);

// /**
//  * Update tour item
//  * PATCH /api/tours/:tourId/items/:itemId
//  */
// router.patch(
//   "/:tourId/items/:itemId",
//   authMiddleware,
//   authorize(ROLES.GUIDE, ROLES.ADMIN),
//   validateBody(tourValidator.updateTourItemSchema),
//   tourController.updateTourItem
// );

// /**
//  * Delete tour item
//  * DELETE /api/tours/:tourId/items/:itemId
//  */
// router.delete(
//   "/:tourId/items/:itemId",
//   authMiddleware,
//   authorize(ROLES.GUIDE, ROLES.ADMIN),
//   tourController.deleteTourItem
// );

// /**
//  * Delete gallery image from tour item
//  * DELETE /api/tours/:tourId/items/:itemId/gallery-image
//  */
// router.delete(
//   "/:tourId/items/:itemId/gallery-image",
//   authMiddleware,
//   authorize(ROLES.GUIDE, ROLES.ADMIN),
//   tourController.deleteItemGalleryImage
// );

export default router;
