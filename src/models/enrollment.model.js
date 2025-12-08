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
      enum: ["pending", "active", "started"], // removed "in_progress"
      default: "pending",
    },
    expiresAt: {
      type: Date,
      default: null, // will be set when enrollment becomes active
    },
  },
  { timestamps: true }
);

enrollmentSchema.pre("save", function (next) {
  if (
    this.isModified("status") &&
    this.status === "started" &&
    !this.expiresAt
  ) {
    this.expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
  }
  next();
});

enrollmentSchema.virtual("isExpired").get(function () {
  return this.expiresAt && Date.now() > this.expiresAt.getTime();
});

enrollmentSchema.virtual("isInProgress").get(function () {
  return this.status === "started" && !this.isExpired;
});

enrollmentSchema.pre(/^find/, function (next) {
  // Populate user and tour by default for enrollment queries. Include
  // `mainImage` and `isPublished` so the frontend can render the tour image
  // directly from enrollment documents without extra lookups.
  this.populate("user", "firstName lastName email").populate(
    "tour",
    "name description price currency place guide mainImage isPublished enrollmentsCount"
  );
  next();
});

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
export default Enrollment;
