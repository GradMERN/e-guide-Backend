import User from "../models/user.model.js";
import asyncHandler from "../utils/async-error-wrapper.utils.js";
import { ROLES } from "../utils/roles.utils.js";
import { sendEmail } from "../utils/send-email.util.js";
import {
  activationSuccessEmailTemplate,
  deactivationEmailTemplate,
} from "../utils/email-templates.util.js";

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

// Import profile-related exports from profile.controller.js
export {
  getProfile,
  updateProfile,
  changePassword,
} from "./profile.controller.js";
