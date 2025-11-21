import User from "../models/user.model.js";
import asyncHandler from "../utils/async-error-wrapper.utils.js";
import bcrypt from "bcrypt";
import { sendEmail } from "../utils/send-email.util.js";
import { generateToken } from "../utils/jwt.utils.js";

// Get logged-in user profile
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user)
    return res
      .status(404)
      .json({ success: false, status: "fail", message: "User not found" });

  res.status(200).json({ success: true, status: "success", data: user });
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

  const isMatch = await bcrypt.compare(currentPassword, user.password);
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
