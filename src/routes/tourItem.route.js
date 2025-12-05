import express from "express";
import {
  getTourItems,
  getTourItemById,
  updateTourItem,
  createTourItem,
  deleteTourItem,
} from "../controllers/tourItem.controller.js";
import { authMiddleware } from "../middlewares/authentication.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { upload } from "../utils/upload.util.js";
import {
  createTourItemSchema,
  updateTourItemSchema,
} from "./../validators/tourItem.validator.js";
import { authNonBlockingMiddleware } from "../middlewares/authenticationNonBlocking.middleware.js";
import { authorizeRoles } from "../middlewares/authorization.middleware.js";
import { ROLES } from "../utils/roles.utils.js";

const router = express.Router({ mergeParams: true });

router.get("/", authNonBlockingMiddleware, getTourItems);

router.get("/:itemId", getTourItemById);

// Add POST and PATCH for tour items with validation
router.use(authMiddleware);
router.use(authorizeRoles(ROLES.GUIDE, ROLES.ADMIN));
router.post(
  "/",
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "galleryImages", maxCount: 10 },
    { name: "audio", maxCount: 1 },
  ]),
  validateBody(createTourItemSchema),
  createTourItem
);
router.patch(
  "/:itemId",
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "galleryImages", maxCount: 10 },
    { name: "audio", maxCount: 1 },
  ]),
  validateBody(updateTourItemSchema),
  updateTourItem
);
router.delete("/:itemId", deleteTourItem);

export default router;
