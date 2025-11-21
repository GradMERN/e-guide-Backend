import express from "express";
import {
  getTourItems,
  getTourItemById,
} from "../controllers/tourItem.controller.js";
import { authMiddleware } from "../middlewares/authentication.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { tourItemSchema } from "../validators/tourItem.validator.js";

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

router.get("/", getTourItems);
router.get("/:itemId", getTourItemById);
// Add POST and PATCH for tour items with validation
router.post("/", validateBody(tourItemSchema), (req, res) => {
  // Implement createTourItem controller logic here
  res.status(501).json({ success: false, message: "Not implemented" });
});
router.patch("/:itemId", validateBody(tourItemSchema), (req, res) => {
  // Implement updateTourItem controller logic here
  res.status(501).json({ success: false, message: "Not implemented" });
});

export default router;
