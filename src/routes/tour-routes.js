import express from "express";
import * as tourController from "../controllers/tour.controller.js";
import {
  authMiddleware,
  authorize,
} from "../middlewares/authentication.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { ROLES } from "../utils/roles.utils.js";
import * as tourValidator from "../validators/tour.validator.js";

const router = express.Router();

router.get("/", tourController.getTours);

router.get(
  "/my-tours",
  authMiddleware,
  authorize(ROLES.GUIDE, ROLES.ADMIN),
  tourController.getGuideTours
);

router.get("/:id", tourController.getTour);

router.post(
  "/",
  authMiddleware,
  authorize(ROLES.GUIDE, ROLES.ADMIN),
  validateRequest(tourValidator.createTourSchema),
  tourController.createTour
);

router.patch(
  "/:id",
  authMiddleware,
  authorize(ROLES.GUIDE, ROLES.ADMIN),
  validateRequest(tourValidator.updateTourSchema),
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

router.post(
  "/:tourId/items",
  authMiddleware,
  authorize(ROLES.GUIDE, ROLES.ADMIN),
  validateRequest(tourValidator.createTourItemSchema),
  tourController.createTourItem
);

router.get("/:tourId/items", tourController.getTourItems);

router.get("/:tourId/items/:itemId", tourController.getTourItem);

router.patch(
  "/:tourId/items/:itemId",
  authMiddleware,
  authorize(ROLES.GUIDE, ROLES.ADMIN),
  validateRequest(tourValidator.updateTourItemSchema),
  tourController.updateTourItem
);

router.delete(
  "/:tourId/items/:itemId",
  authMiddleware,
  authorize(ROLES.GUIDE, ROLES.ADMIN),
  tourController.deleteTourItem
);

router.delete(
  "/:tourId/items/:itemId/gallery-image",
  authMiddleware,
  authorize(ROLES.GUIDE, ROLES.ADMIN),
  tourController.deleteItemGalleryImage
);

export default router;
