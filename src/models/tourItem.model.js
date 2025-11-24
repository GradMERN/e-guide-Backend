import mongoose from "mongoose";

const tourItemSchema = new mongoose.Schema(
  {
    // Waypoint Title
    title: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 100,
    },

    // Tour Reference
    tour: {
      type: mongoose.Types.ObjectId,
      ref: "Tour",
      required: true,
    },

    // GPS Location (GeoJSON)
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
    },

    // Main Waypoint Image (Cloudinary)
    mainImage: {
      url: String,
      public_id: String,
    },

    // Waypoint Gallery Images (Cloudinary)
    galleryImages: [
      {
        url: String,
        public_id: String,
        caption: {
          type: String,
        },
      },
    ],

    // Audio Narration/Script (Optional)
    audio: {
      url: String,
      public_id: String,
      duration: {
        type: Number,
      },
    },

    // Narration Text
    script: {
      type: String,
      maxlength: 5000,
    },

    contentType: {
      type: String,
      enum: ["informational", "interactive", "activity", "photo-spot"],
      default: "informational",
    },
    // Publication Status
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Geospatial index for location queries
tourItemSchema.index({ "location.coordinates": "2dsphere" });
tourItemSchema.index({ tour: 1 });

// Pre-save validation
tourItemSchema.pre("validate", function (next) {
  if (
    !Array.isArray(this.location.coordinates) ||
    this.location.coordinates.length !== 2
  ) {
    return next(new Error("Coordinates must be [longitude, latitude]"));
  }

  const [lng, lat] = this.location.coordinates;
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    return next(new Error("Invalid latitude or longitude values"));
  }
  next();
});

// Pre-find hooks
tourItemSchema.pre(/^find/, function (next) {
  if (this._noPopulate) return next();
  this.populate("tour", "name guide");
  next();
});

const TourItem = mongoose.model("TourItem", tourItemSchema);
export default TourItem;
