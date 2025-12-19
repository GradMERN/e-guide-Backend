import GuideApplication from "../models/guideApplication.model.js";
import User from "../models/user.model.js";
import asyncHandler from "../utils/async-error-wrapper.utils.js";
import { sendEmail } from "../utils/send-email.util.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.util.js";
import {
  interviewScheduledEmailTemplate,
  applicationApprovedEmailTemplate,
  applicationRejectedEmailTemplate,
} from "../utils/email-templates.util.js";

/**
 * Create or submit a guide application with optional file uploads
 * POST /api/v1/guide-applications
 * Accepts form-data with:
 * - background (JSON string): { experience, languages, specialties, bio }
 * - certificates[] (optional files): Certificate files
 * - documents[] (optional files): Document files
 */
export const submitGuideApplication = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Parse background from form-data (sent as JSON string)
  let background;
  try {
    background =
      typeof req.body.background === "string"
        ? JSON.parse(req.body.background)
        : req.body.background;
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid background data format",
    });
  }

  // Check if user already has an application
  let application = await GuideApplication.findOne({ user: userId });

  if (!application) {
    application = new GuideApplication({
      user: userId,
      background,
      status: "pending",
      certificates: [],
    });
  } else {
    // Update existing application
    application.background = background;
    application.status = "pending";
    application.submittedAt = new Date();
  }

  // Handle certificate file uploads (optional)
  if (
    req.files &&
    req.files.certificates &&
    req.files.certificates.length > 0
  ) {
    for (const file of req.files.certificates) {
      try {
        const result = await uploadToCloudinary(
          file.path,
          `guide-certificates/${userId}`
        );
        application.certificates.push({
          name: file.originalname,
          issuer: "Self-Provided",
          url: result.secure_url,
          public_id: result.public_id,
        });
      } catch (uploadError) {
        console.error("Certificate upload error:", uploadError);
        // Continue with other files
      }
    }
  }

  // Handle document file uploads (optional) - also stored as certificates
  if (req.files && req.files.documents && req.files.documents.length > 0) {
    for (const file of req.files.documents) {
      try {
        const result = await uploadToCloudinary(
          file.path,
          `guide-documents/${userId}`
        );
        application.certificates.push({
          name: file.originalname,
          issuer: "Supporting Document",
          url: result.secure_url,
          public_id: result.public_id,
        });
      } catch (uploadError) {
        console.error("Document upload error:", uploadError);
        // Continue with other files
      }
    }
  }

  await application.save();

  res.status(201).json({
    success: true,
    message: "Application submitted successfully",
    data: application,
  });
});

/**
 * Upload certificate to guide application
 * POST /api/v1/guide-applications/certificates
 */
export const uploadCertificate = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  // Get or create application
  let application = await GuideApplication.findOne({ user: userId });

  if (!application) {
    application = new GuideApplication({ user: userId });
  }

  // Upload to Cloudinary
  const result = await uploadToCloudinary(
    req.file.path,
    `guide-certificates/${userId}`
  );

  // Add certificate to application
  application.certificates.push({
    name: req.body.name || req.file.originalname,
    issuer: req.body.issuer,
    url: result.secure_url,
    public_id: result.public_id,
  });

  await application.save();

  res.status(200).json({
    success: true,
    message: "Certificate uploaded successfully",
    certificate: application.certificates[application.certificates.length - 1],
  });
});

/**
 * Delete certificate from application
 * DELETE /api/v1/guide-applications/certificates/:certificateId
 */
export const deleteCertificate = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { certificateId } = req.params;

  const application = await GuideApplication.findOne({ user: userId });

  if (!application) {
    return res.status(404).json({
      success: false,
      message: "Application not found",
    });
  }

  const certificate = application.certificates.id(certificateId);

  if (!certificate) {
    return res.status(404).json({
      success: false,
      message: "Certificate not found",
    });
  }

  // Delete from Cloudinary
  await deleteFromCloudinary(certificate.public_id);

  // Remove from application
  application.certificates.id(certificateId).deleteOne();
  await application.save();

  res.status(200).json({
    success: true,
    message: "Certificate deleted successfully",
  });
});

/**
 * Download certificate file
 * GET /api/v1/guide-applications/certificates/:certificateId/download
 * Accessible by the owner or admin
 */
export const downloadCertificate = asyncHandler(async (req, res) => {
  const { certificateId } = req.params;
  const userId = req.user._id;
  const isAdmin = req.user.role === "admin";

  // Find application - either owned by user or if admin, any application
  let application;
  if (isAdmin) {
    application = await GuideApplication.findOne({
      "certificates._id": certificateId,
    });
  } else {
    application = await GuideApplication.findOne({
      user: userId,
      "certificates._id": certificateId,
    });
  }

  if (!application) {
    return res.status(404).json({
      success: false,
      message: "Certificate not found",
    });
  }

  const certificate = application.certificates.id(certificateId);

  if (!certificate || !certificate.url) {
    return res.status(404).json({
      success: false,
      message: "Certificate file not found",
    });
  }

  try {
    // Fetch the file from Cloudinary
    const response = await fetch(certificate.url);

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status}`);
    }

    // Get content type from response or guess from filename
    const contentType =
      response.headers.get("content-type") || "application/octet-stream";
    const fileName = certificate.name || "certificate";

    // Set headers for download
    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );

    // Stream the file to client
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Error downloading certificate:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download certificate",
    });
  }
});

/**
 * Get user's guide application
 * GET /api/v1/guide-applications/me
 */
export const getMyApplication = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const application = await GuideApplication.findOne({ user: userId }).populate(
    "user",
    "firstName lastName email phone avatar"
  );

  if (!application) {
    return res.status(404).json({
      success: false,
      message: "No application found",
    });
  }

  res.status(200).json({
    success: true,
    data: application,
  });
});

/**
 * Update guide profile (for approved guides)
 * PATCH /api/v1/guide-applications/profile
 */
export const updateGuideProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { background } = req.body;

  // Check if user is a guide
  const user = await User.findById(userId);
  if (user.role !== "guide") {
    return res.status(403).json({
      success: false,
      message: "Only approved guides can update their profile",
    });
  }

  // Find the application
  let application = await GuideApplication.findOne({ user: userId });

  if (!application) {
    // Create one if it doesn't exist (shouldn't happen normally)
    application = new GuideApplication({
      user: userId,
      status: "approved",
      background,
    });
  } else {
    // Update the background
    application.background = {
      ...application.background,
      ...background,
    };
  }

  await application.save();

  res.status(200).json({
    success: true,
    message: "Guide profile updated successfully",
    data: application,
  });
});

/**
 * Get all guide applications (Admin only)
 * GET /api/v1/guide-applications
 */
export const getAllApplications = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const query = {};
  if (status) query.status = status;

  const applications = await GuideApplication.find(query)
    .populate("user", "firstName lastName email phone avatar")
    .populate("reviewedBy", "firstName lastName")
    .sort({ submittedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await GuideApplication.countDocuments(query);

  res.status(200).json({
    success: true,
    count: applications.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
    data: applications,
  });
});

/**
 * Get single application (Admin)
 * GET /api/v1/guide-applications/:id
 */
export const getApplicationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const application = await GuideApplication.findById(id)
    .populate("user", "firstName lastName email phone avatar")
    .populate("reviewedBy", "firstName lastName");

  if (!application) {
    return res.status(404).json({
      success: false,
      message: "Application not found",
    });
  }

  res.status(200).json({
    success: true,
    data: application,
  });
});

/**
 * Schedule interview for guide applicant
 * PATCH /api/v1/guide-applications/:id/schedule-interview
 */
export const scheduleInterview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { scheduledDate, scheduledTime, timezone } = req.body;
  const adminId = req.user._id;

  const application = await GuideApplication.findByIdAndUpdate(
    id,
    {
      "interview.scheduledDate": new Date(scheduledDate),
      "interview.scheduledTime": scheduledTime,
      "interview.timezone": timezone,
      "interview.status": "scheduled",
      status: "interview_scheduled",
      reviewedBy: adminId,
      reviewedAt: new Date(),
    },
    { new: true }
  ).populate("user", "firstName lastName email");

  if (!application) {
    return res.status(404).json({
      success: false,
      message: "Application not found",
    });
  }

  // Send email to guide with beautiful template
  const user = application.user;
  const emailTemplate = interviewScheduledEmailTemplate(
    user.firstName,
    user.lastName,
    application.interview.scheduledDate,
    application.interview.scheduledTime,
    timezone
  );

  await sendEmail({
    to: user.email,
    subject: emailTemplate.subject,
    html: emailTemplate.html,
  });

  res.status(200).json({
    success: true,
    message: "Interview scheduled successfully",
    data: application,
  });
});

/**
 * Approve guide application and promote user to guide role
 * PATCH /api/v1/guide-applications/:id/approve
 */
export const approveApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  const adminId = req.user._id;

  const application = await GuideApplication.findByIdAndUpdate(
    id,
    {
      status: "approved",
      "interview.result": "passed",
      "interview.notes": notes,
      reviewedBy: adminId,
      reviewedAt: new Date(),
    },
    { new: true }
  ).populate("user");

  if (!application) {
    return res.status(404).json({
      success: false,
      message: "Application not found",
    });
  }

  // Update user role to guide
  const user = await User.findByIdAndUpdate(
    application.user._id,
    { role: "guide" },
    { new: true }
  );

  // Send congratulations email with beautiful template
  const emailTemplate = applicationApprovedEmailTemplate(
    user.firstName,
    user.lastName,
    notes || ""
  );

  await sendEmail({
    to: user.email,
    subject: emailTemplate.subject,
    html: emailTemplate.html,
  });

  res.status(200).json({
    success: true,
    message: "Application approved successfully. User promoted to guide.",
    data: application,
  });
});

/**
 * Reject guide application
 * PATCH /api/v1/guide-applications/:id/reject
 */
export const rejectApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.user._id;

  const application = await GuideApplication.findByIdAndUpdate(
    id,
    {
      status: "rejected",
      "interview.result": "failed",
      rejectionReason: reason,
      reviewedBy: adminId,
      reviewedAt: new Date(),
    },
    { new: true }
  ).populate("user");

  if (!application) {
    return res.status(404).json({
      success: false,
      message: "Application not found",
    });
  }

  // Send rejection email with beautiful template
  const user = application.user;
  const emailTemplate = applicationRejectedEmailTemplate(
    user.firstName,
    user.lastName,
    reason || ""
  );

  await sendEmail({
    to: user.email,
    subject: emailTemplate.subject,
    html: emailTemplate.html,
  });

  res.status(200).json({
    success: true,
    message: "Application rejected. Notification email sent.",
    data: application,
  });
});

/**
 * Get applications statistics (Admin dashboard)
 * GET /api/v1/guide-applications/stats
 */
export const getApplicationStats = asyncHandler(async (req, res) => {
  const stats = await GuideApplication.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const totalApplications = await GuideApplication.countDocuments();
  const pendingApplications = await GuideApplication.countDocuments({
    status: "pending",
  });
  const approvedGuides = await User.countDocuments({ role: "guide" });

  res.status(200).json({
    success: true,
    data: {
      totalApplications,
      pendingApplications,
      approvedGuides,
      byStatus: stats,
    },
  });
});
