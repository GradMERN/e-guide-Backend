import mongoose from "mongoose";

const placeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    country: { type: String, required: true },
    city: { type: String, required: true },
    category: {
      type: String,
      enum: ["historical", "cultural", "religious", "modern", "natural"],
      required: true,
    },
  },
  { timestamps: true }
);

placeSchema.pre("save", function (next) {
  ["country", "city"].forEach((field) => {
    if (this[field])
      this[field] =
        this[field].charAt(0).toUpperCase() +
        this[field].slice(1).toLowerCase();
  });
  next();
});

// Query middleware to exclude places for deactivated guides
/*
import User from "./user.model.js";
placeSchema.pre(/^find/, async function (next) {
  if (!this.op || !this.op.startsWith('count')) {
    // Only include places for active guides
    this.where({}); // Placeholder for population logic
  }
  next();
});
*/
const Place = mongoose.model("Place", placeSchema);
export default Place;
