import Tour from "../models/tour.model.js";
import APIFeatures from "../utils/apiFeatures.js";
import fs from "fs";
import path from "path";

// Create a tour
export const createTour = async (req, res) => {
  try {
    const tour = await Tour.create(req.body);
    res.status(201).json({ success: true, status: "success", data: tour });
  } catch (err) {
    res
      .status(400)
      .json({ success: false, status: "fail", message: err.message });
  }
};

// Get all tours
export const getTours = async (req, res) => {
  try {
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const tours = await features.query;
    res.status(200).json({
      success: true,
      status: "success",
      results: tours.length,
      data: tours,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, status: "error", message: err.message });
  }
};

// Get tour by ID
export const getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.tourId);
    if (!tour)
      return res
        .status(404)
        .json({ success: false, status: "fail", message: "Tour not found" });
    res.status(200).json({ success: true, status: "success", data: tour });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, status: "error", message: err.message });
  }
};

// Update tour
export const updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.tourId, req.body, {
      new: true,
      runValidators: true,
    });
    if (!tour)
      return res
        .status(404)
        .json({ success: false, status: "fail", message: "Tour not found" });
    res.status(200).json({ success: true, status: "success", data: tour });
  } catch (err) {
    res
      .status(400)
      .json({ success: false, status: "fail", message: err.message });
  }
};

// Delete tour and its images
export const deleteTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.tourId);
    if (!tour)
      return res
        .status(404)
        .json({ success: false, status: "fail", message: "Tour not found" });

    const dir = path.join(process.cwd(), "public", "tours", req.params.tourId);
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });

    res.status(204).json({ success: true, status: "success", data: null });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, status: "error", message: err.message });
  }
};
