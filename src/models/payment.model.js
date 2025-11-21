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

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
