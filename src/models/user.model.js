import mongoose from "mongoose";
import crypto from "crypto";
import { hashPassword, comparePassword } from "../utils/hashing.utils.js";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    age: { type: Number, required: true },
    phone: { type: String, required: true, unique: true },
    country: { type: String, required: true },
    city: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    avatar: { type: String, default: null },
    role: { type: String, enum: ["user", "guide", "admin"], default: "user" },
    loginMethod: { type: String, enum: ["local", "google"], default: "local" },
    lastLogin: { type: Date, default: null },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    passwordChangedAt: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.firstName) {
    this.firstName =
      this.firstName.charAt(0).toUpperCase() +
      this.firstName.slice(1).toLowerCase();
  }
  if (this.lastName) {
    this.lastName =
      this.lastName.charAt(0).toUpperCase() +
      this.lastName.slice(1).toLowerCase();
  }
  if (this.country) {
    this.country =
      this.country.charAt(0).toUpperCase() +
      this.country.slice(1).toLowerCase();
  }
  if (this.city) {
    this.city =
      this.city.charAt(0).toUpperCase() + this.city.slice(1).toLowerCase();
  }
  if (this.isModified("email") && this.email) {
    this.email = this.email.toLowerCase();
  }
  if (this.isModified("phone") && this.phone) {
    const cleanedPhone = this.phone.replace(/\D/g, "");

    if (cleanedPhone.length === 11 && cleanedPhone.startsWith("0")) {
      this.phone = "+2" + cleanedPhone;
    } else if (cleanedPhone.length === 12 && cleanedPhone.startsWith("20")) {
      this.phone = "+" + cleanedPhone;
    } else if (cleanedPhone.length === 13 && cleanedPhone.startsWith("20")) {
      this.phone = "+" + cleanedPhone;
    } else {
      const error = new Error("Invalid Egyptian phone number format");
      return next(error);
    }
  }
  if (this.isModified("avatar") && this.avatar === "") {
    this.avatar = null;
  }
  if (this.isModified("password") && this.password) {
    this.password = await hashPassword(this.password);
    this.passwordChangedAt = Date.now() + 1000;
  }
  next();
});

userSchema.methods.matchPassword = async function (password) {
  if (!this.password) return false;
  return await comparePassword(password, this.password);
};

userSchema.methods.generateEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;

  return verificationToken;
};

userSchema.methods.generateResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

userSchema.methods.passwordChangedBefore = function (jwtTimestamp) {
  console.log("hey");
  if (!this.passwordChangedAt) return false;
  console.log("hey");
  const passwordChangedAtTimestamp = Math.floor(
    this.passwordChangedAt.getTime() / 1000
  );
  return passwordChangedAtTimestamp > jwtTimestamp;
};

const User = mongoose.model("User", userSchema);

export default User;
