import User from "../models/user.model.js";
import asyncHandler from "../utils/async-error-wrapper.utils.js";
import { ROLES } from "../utils/roles.utils.js";
import Tour from "../models/tour.model.js";
import Enrollment from "../models/enrollment.model.js";
import Payment from "../models/payment.model.js";

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find();

  res.status(200).json({ success: true, count: users.length, data: users });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.status(200).json({ success: true, data: user });
});

export const updateRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (req.user.id === req.params.id) {
    return res
      .status(403)
      .json({ success: false, message: "You cannot change your own role" });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (!Object.values(ROLES).includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role" });
  }

  user.role = role;
  await user.save();

  res.status(200).json({
    success: true,
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

export const deleteUserAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (user._id.toString() === req.user.id) {
    return res
      .status(403)
      .json({ success: false, message: "You cannot delete your own account" });
  }

  await user.deleteOne();

  res
    .status(200)
    .json({
      success: true,
      message: "User account has been permanently deleted.",
    });
});

export const getDashboardStats = asyncHandler(async (req, res) => {
  const usersCount = await User.countDocuments();
  const guidesCount = await User.countDocuments({ role: ROLES.GUIDE });
  const adminsCount = await User.countDocuments({ role: ROLES.ADMIN });
  const toursCount = await Tour.countDocuments();
  const enrollmentsCount = await Enrollment.countDocuments();
  const paymentsCount = await Payment.countDocuments();
  const paymentsPaid = await Payment.countDocuments({ status: "paid" });
  const recentUsers = await User.find()
    .sort("-createdAt")
    .limit(5)
    .select("firstName lastName email createdAt");

  res.status(200).json({
    success: true,
    data: {
      usersCount,
      guidesCount,
      adminsCount,
      toursCount,
      enrollmentsCount,
      paymentsCount,
      paymentsPaid,
      recentUsers,
    },
  });
});
