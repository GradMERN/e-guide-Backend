import Tour from "../models/tour.model.js";
import TourItem from "../models/tourItem.model.js";
import APIFeatures from "../utils/apiFeatures.js";
import asyncHandler from "../utils/async-error-wrapper.utils.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadStreamToCloudinary,
} from "../utils/cloudinary.util.js";
import { ROLES } from "../utils/roles.utils.js";

// ==================== TOUR CRUD ====================

/**
 * Create a new tour (draft mode)
 * Guide uploads basic info, images, and details
 */
export const createTour = asyncHandler(async (req, res) => {
  const { name, description, price, place, categories, tags, languages } =
    req.body;
  let mainImage = undefined;
  let galleryImages = [];

  // --------- MAIN IMAGE ----------
  if (req.files?.mainImage?.length) {
    mainImage = await uploadStreamToCloudinary(
      req.files.mainImage[0].buffer,
      "tours/main"
    );
  }

  // --------- GALLERY IMAGES ----------
  if (req.files?.galleryImages?.length) {
    const uploadPromises = req.files.galleryImages.map((img) =>
      uploadStreamToCloudinary(img.buffer, "tours/gallery")
    );

    galleryImages = await Promise.all(uploadPromises);
  }
  const newTour = {
    name,
    description,
    price,
    place,
    guide: req.user._id,
    categories: categories || [],
    tags: tags || [],
    languages: languages || [],
    // isDraft: true,
    isPublished: false,
  };
  if (mainImage) Object.assign(newTour, { mainImage });
  if (galleryImages) Object.assign(newTour, { galleryImages });
  const tour = await Tour.create(newTour);
  // Upload main image if provided
  if (req.files && req.files.mainImage) {
    try {
      const result = await uploadToCloudinary(
        req.files.mainImage.tempFilePath,
        "tours/main"
      );
      tour.mainImage = { url: result.secure_url, public_id: result.public_id };
      await tour.save();
    } catch (error) {
      console.error("Main image upload failed:", error);
    }
  }

  res.status(201).json({
    success: true,
    status: "success",
    message: "Tour created in draft mode",
    data: tour,
  });
});

/**
 * Get all tours with filters (published only for users)
 */
export const getTours = asyncHandler(async (req, res) => {
  const { category, difficulty, priceMin, priceMax, place } = req.query;

  let query = { isPublished: true };

  if (category) query.categories = category;
  if (difficulty) query.difficulty = difficulty;
  if (priceMin || priceMax) {
    query.price = {};
    if (priceMin) query.price.$gte = priceMin;
    if (priceMax) query.price.$lte = priceMax;
  }
  if (place) query.place = place;

  const features = new APIFeatures(Tour.find(query), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tours = await features.query;
  const total = await Tour.countDocuments(query);

  res.status(200).json({
    success: true,
    status: "success",
    results: tours.length,
    total,
    page: req.query.page || 1,
    data: tours,
  });
});

/**
 * Get guide's tours (draft and published)
 */
export const getGuideTours = asyncHandler(async (req, res) => {
  const tours = await Tour.find({ guide: req.user._id })
    .select(
      "name description price rating enrollmentsCount isPublished createdAt"
    )
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    status: "success",
    count: tours.length,
    data: tours,
  });
});

/**
 * Get single tour by ID
 */
export const getTour = asyncHandler(async (req, res) => {
  const tour = await Tour.findById(req.params.id).populate("place").populate({
    path: "guide",
    select: "firstName lastName avatar email",
  });

  if (!tour) {
    return res.status(404).json({
      success: false,
      status: "fail",
      message: "Tour not found",
    });
  }

  // Check access: published or owner
  if (
    !tour.isPublished &&
    req.user &&
    tour.guide._id.toString() !== req.user._id.toString() &&
    req.user.role !== ROLES.ADMIN
  ) {
    return res.status(403).json({
      success: false,
      status: "fail",
      message: "Not authorized to view this tour",
    });
  }

  res.status(200).json({
    success: true,
    status: "success",
    data: tour,
  });
});

/**
 * Update tour details and cover image
 */
export const updateTour = asyncHandler(async (req, res) => {
  const tour = await Tour.findById(req.params.id);

  if (!tour) {
    return res.status(404).json({
      success: false,
      status: "fail",
      message: "Tour not found",
    });
  }

  // Check ownership
  if (
    tour.guide._id.toString() !== req.user._id.toString() &&
    req.user.role !== ROLES.ADMIN
  ) {
    return res.status(403).json({
      success: false,
      status: "fail",
      message: "Not authorized to update this tour",
    });
  }

  // Update allowed fields
  const allowedFields = [
    "name",
    "description",
    "price",
    "categories",
    "tags",
    "languages",
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      tour[field] = req.body[field];
    }
  });

  // Handle main image update
  let galleryImages = [];
  let mainImage = undefined;
  // --------- MAIN IMAGE ----------
  if (req.files?.mainImage?.length) {
    await deleteFromCloudinarys(tour.mainImage.public_id || []);
    mainImage = await uploadStreamToCloudinary(
      req.files.mainImage[0].buffer,
      "tours/main"
    );
  }

  // --------- GALLERY IMAGES ----------
  if (req.files?.galleryImages?.length) {
    const uploadPromises = req.files.galleryImages.map((img) =>
      uploadStreamToCloudinary(img.buffer, "tours/gallery")
    );

    galleryImages = await Promise.all(uploadPromises);
  }

  // Handle gallery images (add to existing)
  tour.galleryImages.push(...galleryImages);
  if (mainImage) tour.mainImage = mainImage;

  tour.galleryImages = tour.galleryImages.filter(
    (img) => !req.body.deletedGallaryImages?.includes(img.public_id)
  );

  await tour.save();

  for (const publicId of req.body.deletedGallaryImages || []) {
    await deleteFromCloudinary(publicId);
  }

  res.status(200).json({
    success: true,
    status: "success",
    message: "Tour updated successfully",
    data: tour,
  });
});

/**
 * Publish tour (make it visible to users)
 */
export const publishTour = asyncHandler(async (req, res) => {
  const tour = await Tour.findById(req.params.id);

  if (!tour) {
    return res.status(404).json({
      success: false,
      status: "fail",
      message: "Tour not found",
    });
  }

  if (tour.guide.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      status: "fail",
      message: "Not authorized",
    });
  }

  if (!tour.mainImage) {
    return res.status(400).json({
      success: false,
      status: "fail",
      message: "Tour must have a main image before publishing",
    });
  }

  // if (tour.itemsCount === 0) {
  //   return res.status(400).json({
  //     success: false,
  //     status: "fail",
  //     message: "Tour must have at least one waypoint before publishing",
  //   });
  // }

  tour.isPublished = true;
  // tour.isDraft = false;
  await tour.save();

  res.status(200).json({
    success: true,
    status: "success",
    message: "Tour published successfully",
    data: tour,
  });
});

/**
 * Delete tour and all its images
 */
export const deleteTour = asyncHandler(async (req, res) => {
  const tour = await Tour.findById(req.params.id);

  if (!tour) {
    return res.status(404).json({
      success: false,
      status: "fail",
      message: "Tour not found",
    });
  }

  if (
    tour.guide._id.toString() !== req.user._id.toString() &&
    req.user.role !== ROLES.ADMIN
  ) {
    return res.status(403).json({
      success: false,
      status: "fail",
      message: "Not authorized to delete this tour",
    });
  }

  // Delete main image
  if (tour.mainImage && tour.mainImage.public_id) {
    await deleteFromCloudinary(tour.mainImage.public_id);
  }

  // Delete gallery images
  for (const img of tour.galleryImages) {
    if (img.public_id) {
      await deleteFromCloudinary(img.public_id);
    }
  }

  // Delete all tour items
  const items = await TourItem.find({ tour: tour._id });
  for (const item of items) {
    // Delete item media
    if (item.mainImage && item.mainImage.public_id) {
      await deleteFromCloudinary(item.mainImage.public_id);
    }
    if (item.audio && item.audio.public_id) {
      await deleteFromCloudinary(item.audio.public_id);
    }
    for (const img of item.gallery) {
      if (img.public_id) {
        await deleteFromCloudinary(img.public_id);
      }
    }
  }

  // Delete all tour items from DB
  await TourItem.deleteMany({ tour: tour._id });

  // Delete tour from DB
  await tour.deleteOne();

  res.status(200).json({
    success: true,
    status: "success",
    message: "Tour deleted successfully",
  });
});

/**
 * Delete gallery image from tour
 */
export const deleteGalleryImage = asyncHandler(async (req, res) => {
  const tour = await Tour.findById(req.params.id);

  if (!tour) {
    return res.status(404).json({
      success: false,
      status: "fail",
      message: "Tour not found",
    });
  }

  if (
    tour.guide.toString() !== req.user._id.toString() &&
    req.user.role !== ROLES.ADMIN
  ) {
    return res.status(403).json({
      success: false,
      status: "fail",
      message: "Not authorized",
    });
  }

  const { public_id } = req.body;
  if (!public_id) {
    return res.status(400).json({
      success: false,
      status: "fail",
      message: "public_id is required",
    });
  }

  // Find and remove from gallery
  tour.galleryImages = tour.galleryImages.filter(
    (img) => img.public_id !== public_id
  );
  await tour.save();

  // Delete from Cloudinary
  await deleteFromCloudinary(public_id);

  res.status(200).json({
    success: true,
    status: "success",
    message: "Image deleted successfully",
    data: tour,
  });
});
