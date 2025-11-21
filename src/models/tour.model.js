import mongoose from "mongoose";

const tourSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    mainImg: String,
    coverImgs: [String],
    place: { type: mongoose.Types.ObjectId, ref: "Place", required: true },
    guide: { type: mongoose.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

tourSchema.pre("save", function (next) {
  if (this.name)
    this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1);
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate("place").populate("guide");
  next();
});

const Tour = mongoose.model("Tour", tourSchema);
export default Tour;
