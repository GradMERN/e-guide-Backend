import User from "../models/user.model.js";
import asyncHandler from "../utils/async-error-wrapper.utils.js";
import { ROLES } from "../utils/roles.utils.js";

// Get all users
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find();
  res.status(200).json({
    success: true,
    status: "success",
    count: users.length,
    data: users,
  });
});

// Get user by ID
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
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

  const user = await User.findById(req.params.id);
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

// ...existing code...

// Import profile-related exports from profile.controller.js
export {
  getProfile,
  updateProfile,
  changePassword,
  deleteMyAccount,
} from "./profile.controller.js";
