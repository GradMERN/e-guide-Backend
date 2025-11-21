import mongoose from "mongoose";

const tourSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, 'Tour name is required'],
      trim: true 
    },
    guide: { 
      type: mongoose.Types.ObjectId, 
      ref: "User", 
      required: [true, 'Guide is required'] 
    },
    price: { 
      type: Number, 
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    currency: { 
      type: String, 
      default: "EGP",
      enum: ['EGP', 'USD', 'EUR']
    },
    description: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    duration: {
      type: Number, // Duration in hours
      min: 1
    },
    maxGroupSize: {
      type: Number,
      default: 10
    },
    images: [{
      type: String
    }],
    ratingsAverage: { 
      type: Number, 
      default: 4.5, 
      min: 1, 
      max: 5 
    },
    ratingsQuantity: { 
      type: Number, 
      default: 0 
    },
  },
  { timestamps: true }
);

// Capitalize name before saving
tourSchema.pre("save", function (next) {
  if (this.name) {
    this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1);
  }
  next();
});

// Populate guide on find
tourSchema.pre(/^find/, function (next) {
  this.populate('guide', 'firstName lastName email avatar city country');
  next();
});

const Tour = mongoose.model("Tour", tourSchema);

export default Tour;