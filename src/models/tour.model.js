import mongoose from "mongoose";

const tourSchema = new mongoose.Schema(
  {
    // Tour Title
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },

    // Tour Description
    description: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 5000,
    },

    // Tour Pricing
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    itemsCount: {
      type: Number,
      default: 0,
    },

    // Currency Type
    currency: {
      type: String,
      enum: ["EGP", "USD", "EUR"],
      default: "EGP",
    },

    // Main Tour Image (Cloudinary)
    mainImage: {
      url: String,
      public_id: String,
    },

    // Tour Gallery Images (Cloudinary)
    galleryImages: [
      {
        url: String,
        public_id: String,
      },
    ],

    // Location Reference
    place: {
      type: mongoose.Types.ObjectId,
      ref: "Place",
      required: true,
    },

    // Tour Guide Reference
    guide: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Tour Difficulty Level
    difficulty: {
      type: String,
      enum: ["easy", "moderate", "hard"],
      default: "moderate",
    },

    // Average Rating
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 4.5,
    },

    // Total Ratings Count
    ratingsCount: {
      type: Number,
      default: 0,
    },

    // Total Enrollments
    enrollmentsCount: {
      type: Number,
      default: 0,
    },

    // Published Status
    isPublished: {
      type: Boolean,
      default: false,
    },
    // Tour Categories
    categories: {
      type: [String],
    },

    // Tour Tags
    tags: {
      type: [String],
    },

    // Supported Languages
    languages: {
      type: [String],
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
tourSchema.index({ guide: 1, isPublished: 1 });
tourSchema.index({ place: 1, isPublished: 1 });
tourSchema.index({ name: "text", description: "text" });
tourSchema.index({ categories: 1 });

// Pre-save hooks
tourSchema.pre("save", function (next) {
  if (this.name) {
    this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1);
  }
  next();
});

// Pre-find hooks for population
tourSchema.pre(/^find/, function (next) {
  this.populate("place", "name country city").populate(
    "guide",
    "firstName lastName avatar"
  );
  next();
});

const Tour = mongoose.model("Tour", tourSchema);
export default Tour;
