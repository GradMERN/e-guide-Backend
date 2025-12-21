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


router.get("/", tourController.getTours);

router.get(
  "/my-tours",
  authMiddleware,
  authorize(ROLES.GUIDE, ROLES.ADMIN),
  tourController.getGuideTours
);

router.get(
  "/guide-stats",
  authMiddleware,
  authorize(ROLES.GUIDE, ROLES.ADMIN),
  tourController.getGuideStats
);

router.get(
  "/guide-analytics",
  authMiddleware,
  authorize(ROLES.GUIDE, ROLES.ADMIN),
  tourController.getGuideAnalytics
);

router.get(
  "/my-reviews",
  authMiddleware,
  authorize(ROLES.GUIDE, ROLES.ADMIN),
  tourController.getGuideReviews
);

router.get("/:id", tourController.getTour);

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

router.put(
  "/:id/publish",
  authMiddleware,
  authorize(ROLES.GUIDE, ROLES.ADMIN),
  tourController.publishTour
);

router.delete(
  "/:id",
  authMiddleware,
  authorize(ROLES.GUIDE, ROLES.ADMIN),
  tourController.deleteTour
);

router.delete(
  "/:id/gallery-image",
  authMiddleware,
  authorize(ROLES.GUIDE, ROLES.ADMIN),
  tourController.deleteGalleryImage
);
router.use("/:tourId/items", tourItemRoutes);

router.get("/:tourId/reviews", reviewController.getTourReviews);

router.post(
  "/:tourId/reviews",
  authMiddleware,
  validateBody(createReviewSchema),
  reviewController.createReviewForTour
);

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
