import Tour from "../models/tour.model.js";
import TourItem from "../models/tourItem.model.js";
import Enrollment from "../models/enrollment.model.js";
import Payment from "../models/payment.model.js";
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

  console.log("Body:", req.body);
  console.log("Files:", req.files);

  let mainImage;
  let galleryImages = [];

  // Upload main image
  if (req.files?.mainImage?.length) {
    mainImage = await uploadStreamToCloudinary(
      req.files.mainImage[0].buffer,
      "tours/main"
    );
  }

  // Upload gallery images
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

  if (mainImage) newTour.mainImage = mainImage;
  if (galleryImages.length) newTour.galleryImages = galleryImages;

  const tour = await Tour.create(newTour);

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
      "name description price rating enrollmentsCount isPublished createdAt mainImage tags categories languages galleryImages itemsCount"
    )
    .sort("-createdAt");

  // Attach counts about items to each tour: total items and published items
  const TourItem = (await import("../models/tourItem.model.js")).default;
  const toursWithCounts = await Promise.all(
    tours.map(async (t) => {
      const itemsCount =
        typeof t.itemsCount === "number"
          ? t.itemsCount
          : await TourItem.countDocuments({ tour: t._id });
      const publishedItemsCount = await TourItem.countDocuments({
        tour: t._id,
        isPublished: true,
      });
      return Object.assign(t.toObject(), { itemsCount, publishedItemsCount });
    })
  );

  res.status(200).json({
    success: true,
    status: "success",
    count: toursWithCounts.length,
    data: toursWithCounts,
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

  // Normalize guide id whether `tour.guide` is populated (object) or an ObjectId
  const guideId =
    tour.guide && tour.guide._id
      ? tour.guide._id.toString()
      : tour.guide.toString();
  const requesterId =
    req.user && req.user._id ? req.user._id.toString() : String(req.user);

  if (guideId !== requesterId) {
    console.warn(
      `Publish attempt unauthorized: tour.guide=${guideId} user=${requesterId}`
    );
    return res.status(403).json({
      success: false,
      status: "fail",
      message: "Not authorized to publish this tour (ownership mismatch)",
    });
  }

  if (!tour.mainImage) {
    return res.status(400).json({
      success: false,
      status: "fail",
      message: "Tour must have a main image before publishing",
    });
  }
  // Allow client to pass desired publish state { isPublished: true|false }.
  const wantPublish =
    req.body.isPublished !== undefined ? !!req.body.isPublished : true;

  if (wantPublish) {
    // Ensure the tour has at least one waypoint before allowing publish.
    // Prefer the stored itemsCount, but fall back to counting documents in DB
    let itemsCount = tour.itemsCount;
    if (!itemsCount || itemsCount === 0) {
      // Recompute to be safe (in case itemsCount was not kept in sync)
      const TourItem = (await import("../models/tourItem.model.js")).default;
      itemsCount = await TourItem.countDocuments({ tour: tour._id });
    }
    if (!itemsCount || itemsCount === 0) {
      return res.status(400).json({
        success: false,
        status: "fail",
        message: "Tour must have at least one waypoint before publishing",
      });
    }
  }

  tour.isPublished = wantPublish;
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

/**
 * Get guide's dashboard statistics
 */
// export const getGuideStats = asyncHandler(async (req, res) => {
//   const guideTours = await Tour.countDocuments({ guide: req.user._id });
//   const publishedTours = await Tour.countDocuments({
//     guide: req.user._id,
//     isPublished: true,
//   });

//   // Get enrollments for this guide's tours
//   const guideToursIds = await Tour.find({ guide: req.user._id }).select("_id");
//   const enrollmentsCount = await Enrollment.countDocuments({
//     tour: { $in: guideToursIds },
//   });

//   // Get earnings
//   const payments = await Payment.find({
//     tour: { $in: guideToursIds },
//     status: "paid",
//   });
//   const totalEarnings = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

//   res.status(200).json({
//     success: true,
//     data: {
//       totalTours: guideTours,
//       publishedTours,
//       activeTours: publishedTours,
//       totalBookings: enrollmentsCount,
//       totalEarnings,
//       averageRating: 4.8,
//     },
//   });
// });

/**
 * Get guide's dashboard statistics
 */
export const getGuideStats = asyncHandler(async (req, res) => {
  const guideId = req.user._id;

  // Get all tours by this guide
  const tours = await Tour.find({ guide: guideId });
  const totalTours = tours.length;
  const publishedTours = tours.filter((tour) => tour.isPublished).length;
  const draftTours = totalTours - publishedTours;

  // Get enrollments for guide's tours
  const tourIds = tours.map((tour) => tour._id);
  const enrollments = await Enrollment.find({ tour: { $in: tourIds } })
    .populate("tour", "name price")
    .populate("user", "firstName lastName email")
    .sort({ createdAt: -1 });

  const totalEnrollments = enrollments.length;

  // Calculate total earnings from payments
  const payments = await Payment.find({
    enrollment: { $in: enrollments.map((e) => e._id) },
    status: "completed",
  });

  const totalEarnings = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  // Calculate average rating
  const totalRating = tours.reduce((sum, tour) => sum + (tour.rating || 0), 0);
  const averageRating =
    tours.length > 0 ? Number((totalRating / tours.length).toFixed(1)) : 0;

  // Recent enrollments (last 5)
  const recentEnrollments = enrollments.slice(0, 5).map((enrollment) => ({
    tourName: enrollment.tour?.name || "Unknown Tour",
    guestName:
      `${enrollment.user?.firstName || ""} ${
        enrollment.user?.lastName || ""
      }`.trim() || "Unknown Guest",
    date: enrollment.createdAt.toISOString().split("T")[0],
    amount: enrollment.tour?.price || 0,
    status: enrollment.status || "pending",
  }));

  // Tour performance data
  const tourPerformance = tours
    .map((tour) => {
      const tourEnrollments = enrollments.filter(
        (e) => e.tour._id.toString() === tour._id.toString()
      );
      return {
        name: tour.name,
        enrollments: tourEnrollments.length,
        revenue: tourEnrollments.length * tour.price,
      };
    })
    .sort((a, b) => b.enrollments - a.enrollments);

  // Enrollment trends (last 7 days)
  const enrollmentTrends = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayEnrollments = enrollments.filter((e) => {
      const eDate = new Date(e.createdAt);
      return eDate.toDateString() === date.toDateString();
    });
    enrollmentTrends.push({
      day: date.toLocaleString("default", { weekday: "short" }),
      count: dayEnrollments.length,
    });
  }

  // Earnings trends (last 7 days)
  const earningsTrends = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayPayments = payments.filter((p) => {
      const paymentDate = new Date(p.createdAt);
      return paymentDate.toDateString() === date.toDateString();
    });
    const dayEarnings = dayPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    earningsTrends.push({
      day: date.toLocaleString("default", { weekday: "short" }),
      amount: dayEarnings,
    });
  }

  res.status(200).json({
    success: true,
    data: {
      totalTours,
      publishedTours,
      draftTours,
      totalEnrollments,
      totalEarnings,
      averageRating,
      recentEnrollments,
      tourPerformance,
      enrollmentTrends,
      earningsTrends,
      tours: tours.map((tour) => ({
        id: tour._id,
        name: tour.name,
        price: tour.price,
        isPublished: tour.isPublished,
        createdAt: tour.createdAt,
      })),
    },
  });
});

/**
 * Get guide's analytics
 */
export const getGuideAnalytics = asyncHandler(async (req, res) => {
  const guideToursIds = await Tour.find({ guide: req.user._id }).select("_id");
  const tourIds = guideToursIds.map((t) => t._id);

  // Get enrollments data
  const enrollments = await Enrollment.find({
    tour: { $in: tourIds },
  }).populate("tour", "name price");

  // Calculate total views (assuming enrollments represent views/bookings)
  const totalViews = enrollments.length;

  // Calculate conversion rate (assuming all views lead to bookings for simplicity)
  const conversionRate = totalViews > 0 ? 100 : 0;

  // Calculate average booking value
  const totalRevenue = enrollments.reduce(
    (sum, e) => sum + (e.tour?.price || 0),
    0
  );
  const averageBookingValue =
    enrollments.length > 0 ? totalRevenue / enrollments.length : 0;

  // Find top tour
  const tourBookings = {};
  enrollments.forEach((e) => {
    const tourName = e.tour?.name || "Unknown";
    tourBookings[tourName] = (tourBookings[tourName] || 0) + 1;
  });
  const topTour = Object.keys(tourBookings).reduce(
    (a, b) => (tourBookings[a] > tourBookings[b] ? a : b),
    "N/A"
  );

  // Monthly comparison (last 6 months)
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: date.toLocaleString("default", { month: "short" }),
      year: date.getFullYear(),
      monthNum: date.getMonth(),
      yearNum: date.getFullYear(),
    });
  }

  const monthlyComparison = months.map(({ month, monthNum, yearNum }) => {
    const monthEnrollments = enrollments.filter((e) => {
      const eDate = new Date(e.createdAt);
      return eDate.getMonth() === monthNum && eDate.getFullYear() === yearNum;
    });
    const monthRevenue = monthEnrollments.reduce(
      (sum, e) => sum + (e.tour?.price || 0),
      0
    );
    return {
      month,
      views: monthEnrollments.length, // assuming views = bookings
      enrollments: monthEnrollments.length,
      revenue: monthRevenue,
    };
  });

  // Tour analytics
  const tourAnalytics = Object.entries(tourBookings).map(([name, bookings]) => {
    const tour = enrollments.find((e) => e.tour?.name === name)?.tour;
    const revenue = bookings * (tour?.price || 0);
    return {
      name,
      views: bookings, // assuming views = bookings
      enrollments: bookings,
      revenue,
    };
  });

  // Source distribution (placeholder, as we don't have source data)
  const sourceDistribution = [
    { name: "Direct", value: 45 },
    { name: "Search", value: 30 },
    { name: "Social", value: 15 },
    { name: "Referral", value: 10 },
  ];

  // Daily views (last 7 days)
  const dailyViews = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayEnrollments = enrollments.filter((e) => {
      const eDate = new Date(e.createdAt);
      return eDate.toDateString() === date.toDateString();
    });
    dailyViews.push({
      day: date.toLocaleString("default", { weekday: "short" }),
      views: dayEnrollments.length,
      enrollments: dayEnrollments.length,
    });
  }

  res.status(200).json({
    success: true,
    data: {
      totalViews,
      conversionRate,
      averageBookingValue,
      topTour,
      dailyViews,
      monthlyComparison,
      tourAnalytics,
      sourceDistribution,
    },
  });
});
