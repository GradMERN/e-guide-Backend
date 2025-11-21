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

const Place = mongoose.model("Place", placeSchema);
export default Place;
