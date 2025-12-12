import User from "../models/user.model.js";
import Tour from "../models/tour.model.js";
import Review from "../models/review.model.js";
import GuideApplication from "../models/guideApplication.model.js";
import asyncHandler from "../utils/async-error-wrapper.utils.js";
import { ROLES } from "../utils/roles.utils.js";

// Get featured guides with their average rating calculated from their tours' reviews
export const getFeaturedGuides = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 6;

  // Get all guides
  const guides = await User.find({ role: ROLES.GUIDE, active: true })
    .select("firstName lastName avatar city country createdAt")
    .lean();

  // For each guide, calculate their average rating from all reviews on their tours
  const guidesWithRatings = await Promise.all(
    guides.map(async (guide) => {
      // Get all tours by this guide
      const tours = await Tour.find({ guide: guide._id }).select("_id").lean();
      const tourIds = tours.map((t) => t._id);

      // Get all reviews for these tours
      const reviewStats = await Review.aggregate([
        { $match: { tour: { $in: tourIds } } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
          },
        },
      ]);

      const stats = reviewStats[0] || { avgRating: 0, totalReviews: 0 };

      return {
        _id: guide._id,
        id: guide._id,
        firstName: guide.firstName,
        lastName: guide.lastName,
        name: `${guide.firstName || ""} ${guide.lastName || ""}`.trim(),
        avatar: guide.avatar,
        city: guide.city,
        country: guide.country,
        rating: Math.round(stats.avgRating * 10) / 10 || 0, // Round to 1 decimal
        totalReviews: stats.totalReviews,
        toursCount: tours.length,
        createdAt: guide.createdAt,
      };
    })
  );

  // Sort by rating (desc), then by total reviews (desc), then limit
  const sortedGuides = guidesWithRatings
    .sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.totalReviews - a.totalReviews;
    })
    .slice(0, limit);

  res.status(200).json({
    success: true,
    count: sortedGuides.length,
    data: sortedGuides,
  });
});

// Get a single guide's public profile with rating
export const getGuideProfile = asyncHandler(async (req, res) => {
  const guide = await User.findOne({
    _id: req.params.id,
    role: ROLES.GUIDE,
  })
    .select("firstName lastName avatar city country createdAt active")
    .lean();

  if (!guide) {
    return res.status(404).json({
      success: false,
      message: "Guide not found",
    });
  }

  // Get guide application data for bio, languages, specialties
  const guideApplication = await GuideApplication.findOne({
    user: guide._id,
    status: "approved",
  })
    .select(
      "background.bio background.languages background.specialties background.experience"
    )
    .lean();

  // Get all tours by this guide (both published and unpublished for count, but only published for display)
  const allTours = await Tour.find({ guide: guide._id }).select("_id").lean();
  const publishedTours = await Tour.find({
    guide: guide._id,
    isPublished: true,
  })
    .select(
      "name mainImage price currency duration rating ratingsCount place maxGroupSize"
    )
    .populate("place", "name city")
    .lean();

  const tourIds = allTours.map((t) => t._id);

  // Get aggregate stats for all reviews
  const reviewStats = await Review.aggregate([
    { $match: { tour: { $in: tourIds } } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  // Get recent reviews for this guide's tours
  const recentReviews = await Review.find({ tour: { $in: tourIds } })
    .populate("user", "firstName lastName avatar")
    .populate("tour", "name")
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const stats = reviewStats[0] || { avgRating: 0, totalReviews: 0 };

  // Format tours for frontend
  const formattedTours = publishedTours.map((tour) => ({
    _id: tour._id,
    name: tour.name,
    image: tour.mainImage?.url,
    price: tour.price,
    currency: tour.currency || "EGP",
    duration: tour.duration,
    maxGroupSize: tour.maxGroupSize,
    ratingsAverage: tour.rating || 0,
    ratingsCount: tour.ratingsCount || 0,
    city: tour.place?.city || tour.place?.name || "Egypt",
  }));

  // Format reviews for frontend
  const formattedReviews = recentReviews.map((review) => ({
    _id: review._id,
    user: review.user
      ? `${review.user.firstName || ""} ${review.user.lastName || ""}`.trim()
      : "Anonymous",
    avatar: review.user?.avatar?.url,
    rating: review.rating,
    comment: review.review,
    tourName: review.tour?.name,
    createdAt: review.createdAt,
  }));

  res.status(200).json({
    success: true,
    data: {
      _id: guide._id,
      id: guide._id,
      firstName: guide.firstName,
      lastName: guide.lastName,
      name: `${guide.firstName || ""} ${guide.lastName || ""}`.trim(),
      avatar: guide.avatar,
      city: guide.city,
      country: guide.country,
      bio: guideApplication?.background?.bio || null,
      languages: guideApplication?.background?.languages || [],
      specialties: guideApplication?.background?.specialties || [],
      experience: guideApplication?.background?.experience || null,
      rating: Math.round(stats.avgRating * 10) / 10 || 0,
      totalReviews: stats.totalReviews,
      toursCount: allTours.length,
      tours: formattedTours,
      reviews: formattedReviews,
      createdAt: guide.createdAt,
    },
  });
});
