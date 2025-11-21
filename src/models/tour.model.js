import mongoose from "mongoose";

const tourSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true, default: 0 },
    mainImg: String,
    coverImgs: [String],
    place: { type: mongoose.Types.ObjectId, ref: "Place", required: true },
    guide: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, default: 4.5 },
    ratingsQuantity: { type: Number, default: 0 },
  },
  { timestamps: true }
);

tourSchema.pre("save", function (next) {
  if (this.name)
    this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1);
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate("place").populate("guide", "firstName lastName email");
  next();
});

const Tour = mongoose.model("Tour", tourSchema);
export default Tour;
