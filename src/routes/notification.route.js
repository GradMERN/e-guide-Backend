import express from "express";
import { authMiddleware } from "../middlewares/authentication.middleware.js";
import {
  createNotification,
  getUserNotifications,
  markNotificationRead,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getUserNotifications);
router.patch("/:id/read", markNotificationRead);

export default router;
