import mongoose from "mongoose";
import crypto from "crypto";
import { hashPassword, comparePassword } from "../utils/hashing.utils.js";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String  },
    lastName: { type: String  },
    age: { type: Number  },
    phone: { type: String , unique: true },
    country: { type: String  },
    city: { type: String  },
    email: { type: String , unique: true },
    password: {
      type: String,
      required: function () {
        return this.loginMethod === "local";
      },
      select: false,
    },
    avatar: { type: String, default: null },
    role: { type: String, enum: ["user", "guide", "admin"], default: "user" },
    loginMethod: { type: String, enum: ["local", "google"], default: "local" },
    lastLogin: { type: Date, default: null },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
    // isEmailVerified: { type: Boolean, default: false },
    // emailVerificationToken: { type: String, select: false },
    passwordChangedAt: { type: Date, select: false },
    active: { type: Boolean, default: true },
    activationToken: { type: String, select: false },
    activationExpire: { type: Date, select: false },
  },
  { timestamps: true }
);

// Virtual for tours created by this guide
userSchema.virtual("tours", {
  ref: "Tour",
  localField: "_id",
  foreignField: "guide",
});

userSchema.set("toObject", { virtuals: true });
userSchema.set("toJSON", { virtuals: true });

// Pre-save hooks
userSchema.pre("save", async function (next) {
  // Capitalize names and locations
  ["firstName", "lastName", "country", "city"].forEach((field) => {
    if (this[field])
      this[field] =
        this[field].charAt(0).toUpperCase() +
        this[field].slice(1).toLowerCase();
  });

  if (this.isModified("email") && this.email)
    this.email = this.email.toLowerCase();

  // Normalize Egyptian phone number
  if (this.isModified("phone") && this.phone) {
    const cleanedPhone = this.phone.replace(/\D/g, "");
    if (cleanedPhone.length === 10) this.phone = "+2" + cleanedPhone;
    else if (cleanedPhone.length === 12 && cleanedPhone.startsWith("20"))
      this.phone = "+" + cleanedPhone;
    else return next(new Error("Invalid Egyptian phone number format"));
  }

  if (this.isModified("avatar") && this.avatar === "") this.avatar = null;

  if (this.isModified("password") && this.password) {
    this.password = await hashPassword(this.password);
    this.passwordChangedAt = new Date();
  }

  next();
});

// Methods
userSchema.methods.matchPassword = async function (password) {
  if (!this.password) return false;
  return await comparePassword(password, this.password);
};

// Deactivate account: sets active to false, generates activation token/expiry
userSchema.methods.deactivateAccount = function () {
  if (!this.active) throw new Error("Account is already deactivated");
  this.active = false;
  this.activationToken = undefined;
  this.activationExpire = undefined;
};

// Activate account: validates token, sets active to true, clears activation fields
userSchema.methods.activateAccount = function (token) {
  console.log(this.activationExpire)
  if (!this.activationExpire || this.activationExpire < Date.now()) {
    throw new Error("Invalid or expired activation token");
  }
  this.active = true;
  this.activationToken = undefined;
  this.activationExpire = undefined;
};

// Generate activation token for reactivation (returns raw token)
userSchema.methods.generateActivationToken = function () {
  const activationToken = crypto.randomBytes(32).toString("hex");
  this.activationToken = crypto
    .createHash("sha256")
    .update(activationToken)
    .digest("hex");
  this.activationExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return activationToken;
};

// userSchema.methods.generateEmailVerificationToken = function () {
//   const verificationToken = crypto.randomBytes(32).toString("hex");
//   this.emailVerificationToken = crypto
//     .createHash("sha256")
//     .update(verificationToken)
//     .digest("hex");
//   this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
//   return verificationToken;
// };

userSchema.methods.generateResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpire;
  // delete userObject.emailVerificationToken;
  return userObject;
};

userSchema.methods.passwordChangedBefore = function (jwtTimestamp) {
  if (!this.passwordChangedAt) return false;
  const passwordChangedAtTimestamp = Math.floor(
    this.passwordChangedAt.getTime() / 1000
  );
  return passwordChangedAtTimestamp > jwtTimestamp;
};

// Query middleware to exclude deactivated users
/*userSchema.pre(/^find/, function (next) {
  // Only exclude if not a count query
  if (!this.op || !this.op.startsWith("count")) {
    this.where({ active: true });
  }
  next();
});*/
const User = mongoose.model("User", userSchema);
export default User;
