import express from "express";
import { authMiddleware } from "../middlewares/authentication.middleware.js";
import { authorizeRoles } from "../middlewares/authorization.middleware.js";
import { ROLES } from "../utils/roles.utils.js";
import {
  createTour,
  getTours,
  getTour,
  updateTour,
  deleteTour,
  uploadTourImages,
  deleteTourImage,
} from "../controllers/tour.controller.js";
import { upload } from "../middlewares/fileUpload.middleware.js";
import tourItemRouter from "./tourItem.route.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { tourSchema } from "../validators/tour.validator.js";

const router = express.Router();

router.use(authMiddleware, authorizeRoles(ROLES.GUIDE));

router.post("/", validateBody(tourSchema), createTour);
router.get("/", getTours);
router.get("/:tourId", getTour);
router.patch("/:tourId", validateBody(tourSchema), updateTour);
router.delete("/:tourId", deleteTour);

router.patch(
  "/:tourId/images",
  upload.fields([
    { name: "mainImg", maxCount: 1 },
    { name: "coverImgs", maxCount: 10 },
  ]),
  uploadTourImages
);

router.patch("/:tourId/images/delete", deleteTourImage);

// Nested Tour Items router
router.use("/:tourId/items", tourItemRouter);

export default router;
