import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tour: {
      type: mongoose.Types.ObjectId,
      ref: "Tour",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "expired"],
      default: "pending",
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

enrollmentSchema.pre("save", function (next) {
  if (this.status === "in_progress" && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours
  }
  next();
});

enrollmentSchema.pre(/^find/, function (next) {
  this.populate("user", "firstName lastName email").populate(
    "tour",
    "name price"
  );
  next();
});

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
export default Enrollment;
