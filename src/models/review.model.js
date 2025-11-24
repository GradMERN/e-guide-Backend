import mongoose from "mongoose";
import Tour from "./tour.model.js";

const reviewSchema = new mongoose.Schema(
  {
    tour: { type: mongoose.Types.ObjectId, ref: "Tour", required: true },
    user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true, minlength: 3, maxlength: 1000 },
  },
  { timestamps: true }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate("user", "firstName lastName email");
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: "$tour",
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  await Tour.findByIdAndUpdate(tourId, {
    rating: stats[0]?.avgRating || 4.5,
    ratingsCount: stats[0]?.count || 0,
  });
};

reviewSchema.post("save", function () {
  this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) await doc.constructor.calcAverageRatings(doc.tour);
});

const Review = mongoose.model("Review", reviewSchema);
export default Review;
