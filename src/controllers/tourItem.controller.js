import TourItem from "../models/tourItem.model.js";
import Enrollment from "../models/enrollment.model.js";
import Tour from "../models/tour.model.js";
import { ROLES } from "../utils/roles.utils.js";
import {
  deleteFromCloudinary,
  uploadStreamToCloudinary,
} from "../utils/cloudinary.util.js";
import asyncHandler from "../utils/async-error-wrapper.utils.js";
import { findActiveEnrollment } from "../utils/enrollment.utils.js";

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

    // Determine caller roles and enrollment state
    const isAdmin = userRole === ROLES.ADMIN;
    const isOwner =
      tour.guide?._id &&
      userId &&
      tour.guide._id.toString() === userId.toString();
    let enrollment = null;
    let isActiveEnrollment = false;
    if (userId) {
      // Use findActiveEnrollment to handle multiple enrollments (some expired, some not)
      enrollment = await findActiveEnrollment(tourId, userId);
      isActiveEnrollment = !!(
        enrollment &&
        enrollment.status === "started" &&
        (!enrollment.expiresAt || enrollment.expiresAt > new Date())
      );
    }

    // Access rules:
    // - Admin and owner: see everything (including unpublished).
    // - Active enrolled users: see full details but only for published items.
    // - Others (including anonymous): see only the `title` for published items.
    const selectQuery = { tour: tourId };
    let selectFields;
    if (isAdmin || isOwner) {
      selectFields = "-__v -tour"; // full access
      // do not add isPublished filter
    } else if (isActiveEnrollment) {
      selectFields = "-__v -tour"; // full details but only published
      selectQuery.isPublished = true;
    } else {
      // limited view: return the title and isPublished flag so clients can
      // decide how to display items (do not expose full details)
      selectFields = "title isPublished"; // limited view with published flag
      selectQuery.isPublished = true;
    }

    const query = TourItem.find(selectQuery).select(selectFields);
    query._noPopulate = true;
    const items = await query;

    // Prevent clients and intermediaries from returning 304 Not Modified
    // with no response body by instructing them not to cache these responses.
    res.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
    );
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
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;
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
    // Use findActiveEnrollment to handle multiple enrollments (some expired, some not)
    const enrollment = userId
      ? await findActiveEnrollment(tourId, userId)
      : null;
    const isAdmin = userRole === ROLES.ADMIN;
    const isOwner =
      tour.guide &&
      tour.guide._id &&
      userId &&
      tour.guide._id.toString() === userId.toString();
    const isActiveEnrollment = !!(
      enrollment &&
      enrollment.status === "started" &&
      (!enrollment.expiresAt || enrollment.expiresAt > new Date())
    );

    // Access rules for single item:
    // - Admin or owner: can see unpublished item
    // - Active enrolled users: can see item only if published
    // - Others: limited to title and only published items
    const selectFields =
      isAdmin || isOwner || isActiveEnrollment
        ? "-__v -tour"
        : "title isPublished";
    const findQuery = { _id: itemId, tour: tourId };
    if (!(isAdmin || isOwner)) {
      // If not admin/owner, restrict to published items
      findQuery.isPublished = true;
    }

    const item = await TourItem.findOne(findQuery).select(selectFields);
    if (!item)
      return res
        .status(404)
        .json({ success: false, status: "fail", message: "Item not found" });

    // Prevent caching for single-item responses to avoid clients receiving
    // 304 Not Modified without a response body (which some clients mishandle).
    res.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
    );
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
  if (!tour) {
    return res
      .status(404)
      .json({ success: false, status: "fail", message: "Tour not found" });
  }

  const guideId =
    tour.guide && tour.guide._id ? String(tour.guide._id) : String(tour.guide);
  if (guideId !== String(req.user._id)) {
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
    try {
      const result = await uploadStreamToCloudinary(
        req.files.mainImage[0].buffer,
        "tourItems/main"
      );

      mainImage = result;
    } catch (error) {
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
  if (req.files?.audio?.length) {
    try {
      const result = await uploadStreamToCloudinary(
        req.files.audio[0].buffer,
        "tourItems/audio"
      );
      audio = { url: result.url, public_id: result.public_id };
      if (result.duration !== undefined) audio.duration = result.duration;
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
    if (item.mainImage?.public_id)
      await deleteFromCloudinary(item.mainImage.public_id);
    const result = await uploadStreamToCloudinary(
      req.files.mainImage[0].buffer,
      "tourItems/gallery"
    );
    mainImage = { url: result.url, public_id: result.public_id };
    if (result.duration !== undefined) mainImage.duration = result.duration;
  }

  // --------- GALLERY IMAGES ----------
  if (req.files?.galleryImages?.length) {
    const uploadPromises = req.files.galleryImages.map((img) =>
      uploadStreamToCloudinary(img.buffer, "tourItems/gallery")
    );

    const results = await Promise.all(uploadPromises);
    galleryImages = results.map((r) => ({
      url: r.url,
      public_id: r.public_id,
    }));
  }

  //handle audio update
  if (req.files?.audio?.length) {
    // Delete old audio from Cloudinary
    if (item.audio?.public_id) await deleteFromCloudinary(item.audio.public_id);
    // Upload new audio
    const result = await uploadStreamToCloudinary(
      req.files.audio[0].buffer,
      "tourItems/audio"
    );
    audio = { url: result.url, public_id: result.public_id };
    if (result.duration !== undefined) audio.duration = result.duration;
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

/**
 * Publish / Unpublish a tour item (waypoint)
 * PUT /api/tours/:tourId/items/:itemId/publish
 */
export const publishTourItem = asyncHandler(async (req, res) => {
  const { tourId, itemId } = req.params;

  const item = await TourItem.findById(itemId);
  if (!item) {
    return res.status(404).json({
      success: false,
      status: "fail",
      message: "Waypoint not found",
    });
  }

  // ensure item belongs to the tourId
  // `item.tour` may be either an ObjectId or a populated object ({ _id, ... }).
  const itemTourId =
    item.tour && item.tour._id ? String(item.tour._id) : String(item.tour);
  if (!itemTourId || String(itemTourId) !== String(tourId)) {
    return res.status(400).json({
      success: false,
      status: "fail",
      message: "Waypoint does not belong to the specified tour",
    });
  }

  const tour = await Tour.findById(tourId).populate("guide", "_id");
  if (!tour) {
    return res.status(404).json({
      success: false,
      status: "fail",
      message: "Tour not found",
    });
  }

  // only guide or admin can publish/unpublish
  const userId = String(req.user._id);
  const guideId =
    tour.guide && tour.guide._id ? String(tour.guide._id) : String(tour.guide);
  if (userId !== guideId && req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      status: "fail",
      message: "Not authorized",
    });
  }

  // determine desired state (allow client to pass isPublished in body)
  const wantPublish =
    req.body.isPublished !== undefined ? !!req.body.isPublished : true;

  // if publishing, ensure the item has some content (prevent publishing empty waypoints)
  if (wantPublish) {
    const hasContent = Boolean(
      (item.script && item.script.length > 0) ||
        (item.content && item.content.length > 0) ||
        (item.mainImage && item.mainImage.url) ||
        (item.location &&
          item.location.coordinates &&
          item.location.coordinates.length > 0) ||
        item.title
    );
    if (!hasContent) {
      return res.status(400).json({
        success: false,
        status: "fail",
        message:
          "Cannot publish an empty waypoint. Add content or an image first.",
      });
    }
  }

  item.isPublished = wantPublish;
  await item.save();

  res.status(200).json({ success: true, status: "success", data: item });
});
