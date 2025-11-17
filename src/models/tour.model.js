import mongoose from "mongoose";
import { number } from "zod";

const tourSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    guide: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: "EGP" },
    ratingsAverage: { type: Number, default: 4.5, min: 1, max: 5 },
    ratingsQuantity: { type: Number, default: 0, min: 1, max: 5 },
  },
  { timestamps: true }
);

tourSchema.pre("save", function (next) {
  if (this.name) {
    this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1);
  }
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate("guide");
  next();
});

const Tour = mongoose.model("Tour", tourSchema);

export default Tour;
