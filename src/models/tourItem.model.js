import mongoose from "mongoose";
import { number } from "zod";

const tourItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    tour: { type: mongoose.Types.ObjectId, ref: "Tour", required: true },
    imgs: [String],
    audio: String,
    script: Strings,
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      required: true,
    },
  },

  { timestamps: true }
);

tourItemSchema.index({ location: "2dsphere" });

tourItemSchema.pre("save", function (next) {
  if (this.name) {
    this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1);
  }
  next();
});

tourItemSchema.pre(/^find/, function (next) {
  this.populate("guide");
  next();
});

tourItemSchema.pre(/^find/, function (next) {
  this.populate("tour");
  next();
});

tourItemSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

tourItemSchema.pre("validate", function (next) {
  if (
    !Array.isArray(this.location.coordinates) ||
    this.location.coordinates.length !== 2
  ) {
    return next(new Error("Coordinates must be [lng, lat]"));
  }
  next();
});

const TourItem = mongoose.model("TourItem", tourItemSchema);

export default TourItem;
