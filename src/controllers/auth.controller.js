import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import asyncHandler from "../utils/async-error-wrapper.utils.js";
import { generateToken } from "../utils/jwt.utils.js";
import { ROLES } from "../utils/roles.utils.js";
import { sendEmail } from "../utils/send-email.util.js";
import {
  welcomeEmailTemplate,
  resetPasswordEmailTemplate,
  passwordResetSuccessTemplate,
  activationEmailTemplate,
} from "../utils/email-templates.util.js";

// Register a new user
export const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, age, phone, country, city, email, password } =
    req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message:
        "Email is already registered. Please log in or use a different email.",
    });
  }

  const user = await User.create({
    firstName,
    lastName,
    age,
    phone,
    country,
    city,
    email,
    password,
  });

  res.status(201).json({
    success: true,
    message:
      "Registration successful. Please verify your email to activate your account.",
    data: { id: user._id, email: user.email },
  });
});

// Verify email
export const verifyEmail = asyncHandler(async (req, res) => {
  const emailVerificationToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    emailVerificationToken,
    emailVerificationExpire: { $gt: Date.now() },
  });

  if (!user)
    return res.status(400).json({
      success: false,
      status: "fail",
      message: "Invalid or expired verification token",
    });

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save();

  const token = generateToken({
    id: user._id,
    email: user.email,
    role: user.role,
  });
  res.status(200).json({
    success: true,
    status: "success",
    message: "Email verified successfully! You can now log in.",
    data: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age,
      email: user.email,
      role: user.role,
      phone: user.phone,
      country: user.country,
      city: user.city,
      createdAt: user.createdAt,
      isEmailVerified: user.isEmailVerified,
      token,
    },
  });
});

// Resend verification email
export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user)
    return res.status(200).json({
      success: true,
      status: "success",
      message:
        "If that email exists and is unverified, a verification email has been sent",
    });
  if (user.isEmailVerified)
    return res.status(400).json({
      success: false,
      status: "fail",
      message: "Email is already verified",
    });

  try {
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    const verificationUrl = `${process.env.SERVER_URL}/api/auth/verify-email/${verificationToken}`;
    const emailContent = welcomeEmailTemplate(user.firstName, verificationUrl);

    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      message: emailContent.text,
      html: emailContent.html,
    });

    res.status(200).json({
      success: true,
      status: "success",
      message: "Verification email sent successfully",
    });
  } catch (error) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();
    res
      .status(500)
      .json({ success: false, status: "error", message: error.message });
  }
});

// Login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");

  if (!user)
    return res.status(401).json({
      success: false,
      status: "fail",
      message: "Invalid email or password",
    });
  if (!user.isEmailVerified)
    return res.status(403).json({
      success: false,
      status: "fail",
      message: "Please verify your email before logging in",
    });

  if (!user.active) {
    // Generate activation token and send activation email
    const activationToken = user.generateActivationToken();
    await user.save();
    const activationUrl = `${process.env.SERVER_URL}/api/users/activate/${activationToken}`;
    const emailContent = activationEmailTemplate(user.firstName, activationUrl);
    try {
      await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        message: emailContent.text,
        html: emailContent.html,
      });
    } catch (error) {}
    return res.status(403).json({
      success: false,
      status: "fail",
      message: "Account is deactivated. Check your email to reactivate.",
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
    return res.status(401).json({
      success: false,
      status: "fail",
      message: "Invalid email or password",
    });

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken({
    id: user._id,
    email: user.email,
    role: user.role,
  });
  res.status(200).json({
    success: true,
    status: "success",
    message: "Login successful",
    data: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      country: user.country,
      city: user.city,
      avatar: user.avatar,
      lastLogin: user.lastLogin,
      token,
    },
  });
});

// Forgot password
export const forgetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user)
    return res.status(200).json({
      success: true,
      status: "success",
      message: "If that email exists, a password reset link has been sent",
    });

  const resetToken = user.generateResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.SERVER_URL}/api/auth/reset-password/${resetToken}`;

  try {
    const emailContent = resetPasswordEmailTemplate(user.firstName, resetUrl);
    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      message: emailContent.text,
      html: emailContent.html,
    });

    res.status(200).json({
      success: true,
      status: "success",
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    res
      .status(500)
      .json({ success: false, status: "error", message: error.message });
  }
});

// Reset password
export const resetPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user)
    return res.status(400).json({
      success: false,
      status: "fail",
      message: "Invalid or expired reset token",
    });

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  const token = generateToken({
    id: user._id,
    email: user.email,
    role: user.role,
  });

  try {
    const emailContent = passwordResetSuccessTemplate(user.firstName);
    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      message: emailContent.text,
      html: emailContent.html,
    });
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
  }

  res.status(200).json({
    success: true,
    status: "success",
    message:
      "Password reset successful. You can now log in with your new password",
    token,
  });
});
