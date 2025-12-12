import mongoose from "mongoose";

const guideApplicationSchema = new mongoose.Schema(
  {
    // Reference to user who applied
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Application status
    status: {
      type: String,
      enum: ["pending", "interview_scheduled", "approved", "rejected"],
      default: "pending",
    },

    // Background information
    background: {
      experience: String, // Years of experience
      languages: [String], // Languages spoken
      specialties: [String], // Areas of expertise (archaeology, history, culture, etc.)
      bio: String, // Professional bio
    },

    // Certificates and qualifications
    certificates: [
      {
        name: String, // Certificate name
        issuer: String, // Issuing organization
        url: String, // Cloudinary URL
        public_id: String, // Cloudinary public ID
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // Interview scheduling
    interview: {
      scheduledDate: Date, // When the interview is scheduled
      scheduledTime: String, // Time in HH:MM format
      timezone: String, // User's timezone
      status: {
        type: String,
        enum: ["not_scheduled", "scheduled", "completed", "cancelled"],
        default: "not_scheduled",
      },
      notes: String, // Admin notes after interview
      result: {
        type: String,
        enum: ["pending", "passed", "failed"],
        default: "pending",
      },
    },

    // Admin review
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin user
    },
    reviewedAt: Date,
    rejectionReason: String, // If rejected, why?

    // Submission tracking
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for faster queries
guideApplicationSchema.index({ user: 1, status: 1 });
guideApplicationSchema.index({ "interview.scheduledDate": 1 });

// Pre-save hook to update the updatedAt timestamp
guideApplicationSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const GuideApplication = mongoose.model(
  "GuideApplication",
  guideApplicationSchema
);

export default GuideApplication;
