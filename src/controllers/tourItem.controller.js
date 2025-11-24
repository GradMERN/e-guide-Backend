import TourItem from "../models/tourItem.model.js";
import Enrollment from "../models/enrollment.model.js";
import Tour from "../models/tour.model.js";
import { ROLES } from "../utils/roles.utils.js";
import {
  deleteFromCloudinary,
  uploadStreamToCloudinary,
} from "../utils/cloudinary.util.js";
import asyncHandler from "../utils/async-error-wrapper.utils.js";

// Get all tour items with access control
export const getTourItems = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;
    const { tourId } = req.params;

    const tour = await Tour.findById(tourId).populate("guide", "_id");

    if (!tour) {
      return res.status(404).json({
        success: false,
        status: "fail",
        message: "Tour not found",
      });
    }

    let selectFields = "title";

    if (userId) {
      const enrollment = await Enrollment.findOne({
        tour: tourId,
        user: userId,
      });
      console.log(
        tour.guide?._id && tour.guide._id.toString() === userId?.toString()
      );
      selectFields =
        userRole === ROLES.ADMIN ||
        (tour.guide?._id && tour.guide._id.toString() === userId?.toString()) ||
        (enrollment && enrollment.status === "in_progress")
          ? `-__v -tour 
        ${
          enrollment && enrollment.status === "in_progress"
            ? " -isPublished"
            : ""
        }`
          : `title`;
    }
    console.log("Selected Fields:", selectFields);
    const query = TourItem.find({ tour: tourId }).select(selectFields);
    query._noPopulate = true;
    const items = await query;

    res.status(200).json({
      success: true,
      status: "success",
      data: items,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      status: "error",
      message: err.message,
    });
  }
};

// Get single tour item
export const getTourItemById = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { itemId } = req.params;
    //get Item
    const itemDoc = await TourItem.findById(itemId);
    if (!itemDoc)
      return res
        .status(404)
        .json({ success: false, status: "fail", message: "Item not found" });
    //get tour ID from item
    const tourId = itemDoc.tour;
    //check access same as get tour items
    const tour = await Tour.findById(tourId);
    if (!tour)
      return res
        .status(404)
        .json({ success: false, status: "fail", message: "Tour not found" });

    const enrollment = await Enrollment.findOne({ tour: tourId, user: userId });
    const hasFullAccess =
      userRole === ROLES.ADMIN ||
      tour.guide._id.equals(userId) ||
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

//tour Item logic is the same as tour logic with minor changes
export const createTourItem = asyncHandler(async (req, res) => {
  const tour = await Tour.findById(req.body.tour);

  if (tour.guide._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      status: "fail",
      message: "Not authorized",
    });
  }
  const { title, location, script, contentType, isPublished } = req.body;
  // Handle main image upload
  let mainImage = null;
  //using buffer of multer
  if (req.files?.mainImage?.length) {
    console.log(req.files.mainImage[0].buffer);
    try {
      const result = await uploadStreamToCloudinary(
        req.files.mainImage[0].buffer,
        "tourItems/main"
      );

      mainImage = result;
    } catch (error) {
      console.error("Main image upload failed:", error);
      res.status(500).json({
        success: false,
        status: "error",
        message: "Main image upload failed",
      });
      return;
    }
  }

  // Handle audio upload
  let audio = null;
  if (req.files && req.files.audio) {
    try {
      const result = await uploadStreamToCloudinary(
        req.files.audio[0].buffer,
        "tourItems/audio"
      );
      audio = { url: result.url, public_id: result.public_id };
    } catch (error) {
      console.error("Audio upload failed:", error);
      res.status(500).json({
        success: false,
        status: "error",
        message: "Audio upload failed",
      });
      return;
    }
  }

  //handle gallery images upload
  let galleryImages = [];
  if (req.files && req.files.galleryImages) {
    for (const file of req.files.galleryImages) {
      try {
        const result = await uploadStreamToCloudinary(
          file.buffer,
          "tourItems/gallery"
        );
        galleryImages.push({ url: result.url, public_id: result.public_id });
      } catch (error) {
        console.error("Gallery image upload failed:", error);
        res.status(500).json({
          success: false,
          status: "error",
          message: "Gallery image upload failed",
        });
        return;
      }
    }
  }
  const newTourItem = {
    title,
    tour,
    location,
    script,
    contentType,
    isPublished: isPublished || false,
  };
  if (mainImage) Object.assign(newTourItem, { mainImage });
  if (audio) Object.assign(newTourItem, { audio });
  if (galleryImages.length > 0) Object.assign(newTourItem, { galleryImages });
  try {
    const item = await TourItem.create(newTourItem);

    // Update tour itemsCount
    tour.itemsCount = await TourItem.countDocuments({
      tour: req.body.tour.toString(),
    });
    await tour.save();
    res.status(201).json({
      success: true,
      status: "success",
      message: "Waypoint created successfully",
      data: item,
    });
  } catch (error) {
    console.error("Tour item creation failed:", error);
    res.status(500).json({
      success: false,
      status: "error",
      message: "Tour item creation failed",
    });
  }
});

/**
 * Get tour items (waypoints)
 */

/**
 * Update tour item
 */
export const updateTourItem = asyncHandler(async (req, res) => {
  const item = await TourItem.findOne({
    _id: req.params.itemId,
  });
  if (!item) {
    return res.status(404).json({
      success: false,
      status: "fail",
      message: "Waypoint not found",
    });
  }
  const tour = await Tour.findById(item.tour._id.toString());
  if (tour.guide._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      status: "fail",
      message: "Not authorized",
    });
  }
  const { title, description, location, script, contentType, isPublished } =
    req.body;
  item.title = title || item.title;
  item.description = description || item.description;
  item.location = location || item.location;
  item.script = script || item.script;
  item.contentType = contentType || item.contentType;
  if (isPublished !== undefined) item.isPublished = isPublished;
  //check for (main  image gallary images to add and removedgallary image)
  // Handle main image update
  let galleryImages = [];
  let mainImage = undefined;
  let audio = undefined;
  // --------- MAIN IMAGE ----------
  if (req.files?.mainImage?.length) {
    deleteFromCloudinary(item.mainImage?.public_id || []);
    mainImage = await uploadStreamToCloudinary(
      req.files.mainImage[0].buffer,
      "tourItems/gallery"
    );
  }

  // --------- GALLERY IMAGES ----------
  if (req.files?.galleryImages?.length) {
    const uploadPromises = req.files.galleryImages.map((img) =>
      uploadStreamToCloudinary(img.buffer, "tourItems/gallery")
    );

    galleryImages = await Promise.all(uploadPromises);
  }

  //handle audio update
  if (req.files?.audio?.length) {
    // Delete old audio from Cloudinary
    await deleteFromCloudinary(item.audio?.public_id || []);
    // Upload new audio
    audio = await uploadStreamToCloudinary(
      req.files.audio[0].buffer,
      "tourItems/audio"
    );
  }
  // Handle gallery images (add to existing)
  item.galleryImages.push(...galleryImages);
  if (mainImage) item.mainImage = mainImage;
  if (audio) item.audio = audio;

  item.galleryImages = item.galleryImages.filter(
    (img) => !req.body.deletedGallaryImages?.includes(img.public_id)
  );
  for (const publicId of req.body.deletedGallaryImages || []) {
    await deleteFromCloudinary(publicId);
  }

  await item.save();
  res.status(200).json({
    success: true,
    status: "success",
    data: item,
  });
});

/**
 * Delete tour item
 */
export const deleteTourItem = asyncHandler(async (req, res) => {
  const item = await TourItem.findOne({
    _id: req.params.itemId,
  });

  if (!item) {
    return res.status(404).json({
      success: false,
      status: "fail",
      message: "Waypoint not found",
    });
  }

  const tour = await Tour.findById(item.tour._id.toString());
  if (
    tour.guide._id.toString() !== req.user._id.toString() &&
    req.user.role !== ROLES.ADMIN
  ) {
    return res.status(403).json({
      success: false,
      status: "fail",
      message: "Not authorized",
    });
  }

  // Delete all media from Cloudinary
  if (item.mainImage && item.mainImage.public_id) {
    await deleteFromCloudinary(item.mainImage.public_id);
  }
  if (item.audio && item.audio.public_id) {
    await deleteFromCloudinary(item.audio.public_id);
  }
  for (const img of item.galleryImages) {
    if (img.public_id) {
      await deleteFromCloudinary(img.public_id);
    }
  }

  await item.deleteOne();

  // Update tour itemsCount
  tour.itemsCount = await TourItem.countDocuments({ tour: item.tour._id });
  await tour.save();

  res.status(200).json({
    success: true,
    status: "success",
    message: "Waypoint deleted successfully",
  });
});
