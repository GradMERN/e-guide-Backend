import Enrollment from "../models/enrollment.model.js";
import Tour from "../models/tour.model.js";
import asyncHandler from "../utils/async-error-wrapper.utils.js";

// Enroll a user to a tour
export const enrollTour = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { tourId } = req.params;

  const tour = await Tour.findById(tourId);
  if (!tour)
    return res
      .status(404)
      .json({ success: false, status: "fail", message: "Tour not found" });

  const existingEnrollment = await Enrollment.findOne({
    tour: tourId,
    user: userId,
  });
  if (existingEnrollment) {
    return res.status(400).json({
      success: false,
      status: "fail",
      message: "You are already enrolled in this tour",
    });
  }

  const enrollment = await Enrollment.create({
    tour: tourId,
    user: userId,
    status: "in_progress",
  });

  res.status(201).json({
    success: true,
    status: "success",
    message: "Enrollment successful",
    data: { id: enrollment._id, tour: tour.name, status: enrollment.status },
  });
});

// Get user enrollment details
export const getUserEnrollments = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const enrollments = await Enrollment.find({ user: userId }).populate(
    "tour",
    "name description place coverImgs"
  );

  res.status(200).json({
    success: true,
    status: "success",
    count: enrollments.length,
    data: enrollments,
  });
});
