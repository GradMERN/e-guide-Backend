import Enrollment from "../model/enrollment.model.js";
import TourItem from "../model/tourItem.model.js";
import Tour from "../model/tour.model.js";
import { ROLES } from "../utils/roles.utils.js";

export const getUserTourDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { tourId } = req.params;

    const tour = await Tour.findById(tourId);
    if (!tour)
      return res
        .status(404)
        .json({ status: "fail", message: "Tour not found" });

    const enrollment = await Enrollment.findOne({ tour: tourId, user: userId });

    const hasFullAccess =
      userRole === ROLES.ADMIN ||
      tour.guide.equals(userId) ||
      (enrollment && enrollment.status === "in_progress");

    const items = hasFullAccess
      ? await TourItem.find({ tour: tourId }).select("-__v -tour")
      : await TourItem.find({ tour: tourId }).select("name");

    res.status(200).json({
      status: "success",
      data: {
        tour: {
          name: tour.name,
          description: tour.description,
          coverImgs: tour.coverImgs,
          place: tour.place,
        },
        items,
        enrollmentStatus: enrollment ? enrollment.status : "not_enrolled",
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
