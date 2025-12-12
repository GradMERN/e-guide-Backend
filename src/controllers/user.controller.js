import User from "../models/user.model.js";
import asyncHandler from "../utils/async-error-wrapper.utils.js";
import { ROLES } from "../utils/roles.utils.js";
import { sendEmail } from "../utils/send-email.util.js";
import {
  activationSuccessEmailTemplate,
  deactivationEmailTemplate,
} from "../utils/email-templates.util.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.util.js";
import { generateToken } from "../utils/jwt.utils.js";
import bcrypt from "bcrypt";

// Get all users
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ active: true });
  res.status(200).json({
    success: true,
    status: "success",
    count: users.length,
    data: users,
  });
});

// Get user by ID
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, active: true });
  if (!user)
    return res
      .status(404)
      .json({ success: false, status: "fail", message: "User not found" });

  res.status(200).json({ success: true, status: "success", data: user });
});

// Update user role
export const updateRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (req.user.id === req.params.id) {
    return res.status(403).json({
      success: false,
      status: "fail",
      message: "You cannot change your own role",
    });
  }

  const user = await User.findOne({ _id: req.params.id, active: true });
  if (!user)
    return res
      .status(404)
      .json({ success: false, status: "fail", message: "User not found" });

  if (!Object.values(ROLES).includes(role)) {
    return res
      .status(400)
      .json({ success: false, status: "fail", message: "Invalid role" });
  }

  user.role = role;
  await user.save();

  res.status(200).json({
    success: true,
    status: "success",
    message: "User role updated successfully",
    data: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      updatedAt: user.updatedAt,
    },
  });
});

// Deactivate own account
export const deactivateAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user)
    return res
      .status(404)
      .json({ success: false, status: "fail", message: "User not found" });
  if (!user.active) {
    return res.status(400).json({
      success: false,
      status: "fail",
      message: "Account is already deactivated",
    });
  }
  user.deactivateAccount();
  await user.save();
  // Send deactivation email
  try {
    const emailContent = deactivationEmailTemplate(user.firstName);
    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      message: emailContent.text,
      html: emailContent.html,
    });
  } catch (error) {}
  res.status(200).json({
    success: true,
    status: "success",
    message: "Your account has been deactivated.",
  });
});

// Activate account via token
export const activateAccount = asyncHandler(async (req, res) => {
  const user = await User.findOne({ activationToken: req.params.token }).select(
    "+activationExpire +activationToken"
  );

  console.log(req.params.token, user);
  if (!user)
    return res.status(400).json({
      success: false,
      status: "fail",
      message: "Invalid or expired activation token",
    });
  try {
    user.activateAccount(req.params.token);
    await user.save();
    // Send activation success email
    const emailContent = activationSuccessEmailTemplate(user.firstName);
    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      message: emailContent.text,
      html: emailContent.html,
    });
    res.status(200).json({
      success: true,
      status: "success",
      message: "Account activated successfully! You can now log in.",
    });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, status: "fail", message: error.message });
  }
});

// ==================== PROFILE CONTROLLERS ====================

// Get logged-in user profile
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("+password");
  if (!user)
    return res
      .status(404)
      .json({ success: false, status: "fail", message: "User not found" });

  // Create response object with hasPassword field
  const userResponse = user.toObject();
  userResponse.hasPassword = !!user.password;
  delete userResponse.password; // Don't send actual password

  res
    .status(200)
    .json({ success: true, status: "success", data: userResponse });
});

// Update profile
export const updateProfile = asyncHandler(async (req, res) => {
  const filteredBody = {};
  for (const key in req.body) {
    if (
      [
        "firstName",
        "lastName",
        "age",
        "email",
        "phone",
        "country",
        "city",
      ].includes(key)
    ) {
      filteredBody[key] = req.body[key];
    }
  }

  const user = await User.findById(req.user.id);
  if (!user)
    return res
      .status(404)
      .json({ success: false, status: "fail", message: "User not found" });

  if (filteredBody.email && filteredBody.email !== user.email) {
    const emailExists = await User.findOne({ email: filteredBody.email });
    if (emailExists)
      return res.status(409).json({
        success: false,
        status: "fail",
        message: "Email already in use",
      });
  }

  Object.assign(user, filteredBody);

  // Handle avatar upload/update/delete
  if (req.files && req.files.avatar) {
    // If user already has an avatar, delete it from Cloudinary
    if (
      user.avatar &&
      typeof user.avatar === "object" &&
      user.avatar.public_id
    ) {
      await deleteFromCloudinary(user.avatar.public_id);
    }
    // Upload new avatar
    const result = await uploadToCloudinary(
      req.files.avatar.tempFilePath,
      "avatars"
    );
    user.avatar = { url: result.secure_url, public_id: result.public_id };
  } else if (req.body.removeAvatar === "true" && user.avatar) {
    // Remove avatar if requested
    if (typeof user.avatar === "object" && user.avatar.public_id) {
      await deleteFromCloudinary(user.avatar.public_id);
    }
    user.avatar = null;
  }

  await user.save();

  // Send email notification
  try {
    await sendEmail({
      to: user.email,
      subject: "Profile Updated Successfully",
      message: `Hi ${user.firstName}, your profile has been updated successfully.`,
    });
  } catch (error) {
    // Optionally log error
  }

  res.status(200).json({
    success: true,
    status: "success",
    message: "Profile updated successfully",
    data: user,
  });
});

// Change password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select("+password");
  if (!user)
    return res
      .status(404)
      .json({ success: false, status: "fail", message: "User not found" });

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch)
    return res.status(401).json({
      success: false,
      status: "fail",
      message: "Current password is incorrect",
    });

  user.password = newPassword;
  await user.save();
  const token = generateToken({
    id: user._id,
    email: user.email,
    role: user.role,
  });
  res.status(200).json({
    success: true,
    status: "success",
    message: "Password changed successfully",
    token,
  });
});

// Set password for Google users (who don't have a password yet)
export const setPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  const user = await User.findById(req.user.id).select("+password");

  if (!user)
    return res
      .status(404)
      .json({ success: false, status: "fail", message: "User not found" });

  // Only allow Google users who don't have a password yet
  if (user.loginMethod !== "google") {
    return res.status(400).json({
      success: false,
      status: "fail",
      message:
        "This endpoint is only for Google users. Use change-password instead.",
    });
  }

  // Check if user already has a password (handle empty string case)
  if (user.password && user.password.length > 0) {
    return res.status(400).json({
      success: false,
      status: "fail",
      message: "Password already set. Use change-password to update it.",
    });
  }

  user.password = newPassword;
  await user.save();

  const token = generateToken({
    id: user._id,
    email: user.email,
    role: user.role,
  });

  res.status(200).json({
    success: true,
    status: "success",
    message:
      "Password set successfully. You can now login with email and password.",
    token,
  });
});

// Delete own account
export const deleteMyAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user)
    return res
      .status(404)
      .json({ success: false, status: "fail", message: "User not found" });

  await user.deleteOne();
  res.status(200).json({
    success: true,
    status: "success",
    message: "Your account has been permanently deleted.",
  });
});

// Upload or update user avatar
export const uploadAvatar = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Delete old avatar from Cloudinary if it exists
  if (user.avatar && user.avatar.public_id) {
    try {
      await deleteFromCloudinary(user.avatar.public_id);
    } catch (err) {
      console.error("Error deleting old avatar:", err);
    }
  }

  // Upload new avatar to Cloudinary
  const result = await uploadToCloudinary(req.file.path, `avatars/${userId}`);

  // Update user avatar
  user.avatar = {
    url: result.secure_url,
    public_id: result.public_id,
  };

  await user.save();

  res.status(200).json({
    success: true,
    message: "Avatar uploaded successfully",
    data: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
    },
  });
});

// Delete user avatar
export const deleteAvatar = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (!user.avatar || !user.avatar.public_id) {
    return res.status(400).json({
      success: false,
      message: "No avatar to delete",
    });
  }

  // Delete from Cloudinary
  try {
    await deleteFromCloudinary(user.avatar.public_id);
  } catch (err) {
    console.error("Error deleting avatar from Cloudinary:", err);
  }

  // Clear avatar from user document
  user.avatar = {
    url: null,
    public_id: null,
  };

  await user.save();

  res.status(200).json({
    success: true,
    message: "Avatar deleted successfully",
  });
});

// Get user stats for profile page
export const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Import models dynamically to avoid circular dependencies
  const Enrollment = (await import("../models/enrollment.model.js")).default;
  const Review = (await import("../models/review.model.js")).default;
  const Tour = (await import("../models/tour.model.js")).default;

  // Get user's enrollments
  const enrollments = await Enrollment.find({ user: userId })
    .populate("tour", "name mainImage price")
    .sort({ createdAt: -1 });

  // Calculate stats
  const completedEnrollments = enrollments.filter(
    (e) =>
      e.status === "started" &&
      e.expiresAt &&
      new Date(e.expiresAt) < new Date()
  ).length;

  const activeEnrollments = enrollments.filter(
    (e) =>
      e.status === "started" &&
      (!e.expiresAt || new Date(e.expiresAt) > new Date())
  ).length;

  const pendingEnrollments = enrollments.filter(
    (e) => e.status === "pending"
  ).length;

  // Get user's reviews
  const reviewsCount = await Review.countDocuments({ user: userId });

  // Get user's recent reviews
  const recentReviews = await Review.find({ user: userId })
    .populate("tour", "name")
    .sort({ createdAt: -1 })
    .limit(5);

  // Get recent enrollments for display
  const recentEnrollments = enrollments.slice(0, 5).map((e) => ({
    id: e._id,
    tourName: e.tour?.name || "Unknown Tour",
    tourImage: e.tour?.mainImage?.url || null,
    status: e.status,
    date: e.createdAt,
    expiresAt: e.expiresAt,
  }));

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalEnrollments: enrollments.length,
        completedEnrollments,
        activeEnrollments,
        pendingEnrollments,
        reviewsCount,
      },
      recentEnrollments,
      recentReviews: recentReviews.map((r) => ({
        id: r._id,
        tourName: r.tour?.name || "Unknown Tour",
        rating: r.rating,
        comment: r.comment,
        date: r.createdAt,
      })),
    },
  });
});
