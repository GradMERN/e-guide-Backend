import TourItem from "../models/tourItem.model.js";
import Enrollment from "../models/enrollment.model.js";
import Tour from "../models/tour.model.js";
import { ROLES } from "../utils/roles.utils.js";

// Get all tour items with access control
export const getTourItems = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { tourId } = req.params;

    const tour = await Tour.findById(tourId);
    if (!tour)
      return res
        .status(404)
        .json({ success: false, status: "fail", message: "Tour not found" });

    const enrollment = await Enrollment.findOne({ tour: tourId, user: userId });
    const hasFullAccess =
      userRole === ROLES.ADMIN ||
      tour.guide.equals(userId) ||
      (enrollment && enrollment.status === "in_progress");
    const selectFields = hasFullAccess ? "-__v -tour" : "name";

    const items = await TourItem.find({ tour: tourId }).select(selectFields);
    res.status(200).json({ success: true, status: "success", data: items });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, status: "error", message: err.message });
  }
};

// Get single tour item
export const getTourItemById = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { tourId, itemId } = req.params;

    const tour = await Tour.findById(tourId);
    if (!tour)
      return res
        .status(404)
        .json({ success: false, status: "fail", message: "Tour not found" });

    const enrollment = await Enrollment.findOne({ tour: tourId, user: userId });
    const hasFullAccess =
      userRole === ROLES.ADMIN ||
      tour.guide.equals(userId) ||
      (enrollment && enrollment.status === "in_progress");
    const selectFields = hasFullAccess ? "-__v -tour" : "name";

    const item = await TourItem.findOne({ _id: itemId, tour: tourId }).select(
      selectFields
    );
    if (!item)
      return res
        .status(404)
        .json({ success: false, status: "fail", message: "Item not found" });

    res.status(200).json({ success: true, status: "success", data: item });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, status: "error", message: err.message });
  }
};
