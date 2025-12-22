import express from "express";
import * as reviewController from "../controllers/review.controller.js";
import { authMiddleware } from "../middlewares/authentication.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { reviewSchema } from "../validators/review.validator.js";

const router = express.Router();

router.get("/", reviewController.getReviews);

router.post(
  "/",
  authMiddleware,
  validateBody(reviewSchema),
  reviewController.createReview
);

router.patch(
  "/:id",
  authMiddleware,
  validateBody(reviewSchema.partial()),
  reviewController.updateReview
);

router.delete("/:id", authMiddleware, reviewController.deleteReview);

export default router;
