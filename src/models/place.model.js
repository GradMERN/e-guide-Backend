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

const Place = mongoose.model("Place", placeSchema);
export default Place;
