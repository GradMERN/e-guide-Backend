import express from "express";
import {
  getTourItems,
  getTourItemById,
} from "../controllers/tourItem.controller.js";
import { authMiddleware } from "../middlewares/authentication.middleware.js";

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

router.get("/", getTourItems);
router.get("/:itemId", getTourItemById);

export default router;
