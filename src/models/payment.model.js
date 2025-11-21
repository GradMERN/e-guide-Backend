import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    enrollment: {
      type: mongoose.Types.ObjectId,
      ref: "Enrollment",
      required: true,
    },
    tour: {
      type: mongoose.Types.ObjectId,
      ref: "Tour",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    stripePaymentIntentId: { type: String, select: false },
    paymentMethod: { type: String, default: null },
    currency: {
      type: String,
      default: "EGP",
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
  },
  { timestamps: true }
);

paymentSchema.pre(/^find/, function (next) {
  this.populate("user", "firstName lastName email")
    .populate("tour", "name price")
    .populate("enrollment", "status");
  next();
});

// Query middleware to exclude payments for deactivated users
/*
import User from "./user.model.js";
paymentSchema.pre(/^find/, async function (next) {
  if (!this.op || !this.op.startsWith('count')) {
    // Only include payments for active users
    this.where({}); // Placeholder for population logic
  }
  next();
});*/

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
