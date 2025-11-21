import Notification from "../models/notification.model.js";
import asyncHandler from "../utils/async-error-wrapper.utils.js";

// Create a notification
export const createNotification = asyncHandler(async (req, res) => {
  const { user, message, type } = req.body;
  const notification = await Notification.create({ user, message, type });
  res.status(201).json({ success: true, data: notification });
});

// Get notifications for a user
export const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const notifications = await Notification.find({ user: userId }).sort(
    "-createdAt"
  );
  res.status(200).json({ success: true, data: notifications });
});

// Mark notification as read
export const markNotificationRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const notification = await Notification.findOneAndUpdate(
    { _id: id, user: userId },
    { read: true },
    { new: true }
  );
  if (!notification) {
    return res
      .status(404)
      .json({ success: false, message: "Notification not found or not yours" });
  }
  res.status(200).json({ success: true, data: notification });
});
