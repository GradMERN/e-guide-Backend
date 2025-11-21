import Tour from '../models/tour.model.js';
import asyncHandler from '../utils/async-error-wrapper.utils.js';

export const getAllTours = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = '-createdAt', city, minPrice, maxPrice } = req.query;
  
  const query = {};
  if (city) query.city = city;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  
  const tours = await Tour.find(query)
    .populate('guide', 'firstName lastName email avatar')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Tour.countDocuments(query);

  res.status(200).json({
    success: true,
    count: tours.length,
    total: count,
    totalPages: Math.ceil(count / limit),
    currentPage: Number(page),
    data: tours
  });
});

export const getTourById = asyncHandler(async (req, res) => {
  const tour = await Tour.findById(req.params.id)
    .populate('guide', 'firstName lastName email phone avatar city country');

  if (!tour) {
    return res.status(404).json({
      success: false,
      message: 'Tour not found'
    });
  }

  res.status(200).json({
    success: true,
    data: tour
  });
});

export const createTour = asyncHandler(async (req, res) => {
  const tourData = {
    ...req.body,
    guide: req.user.id
  };

  const tour = await Tour.create(tourData);

  res.status(201).json({
    success: true,
    message: 'Tour created successfully',
    data: tour
  });
});

export const updateTour = asyncHandler(async (req, res) => {
  let tour = await Tour.findById(req.params.id);

  if (!tour) {
    return res.status(404).json({
      success: false,
      message: 'Tour not found'
    });
  }

  // Check authorization
  if (tour.guide.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this tour'
    });
  }

  tour = await Tour.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Tour updated successfully',
    data: tour
  });
});

export const deleteTour = asyncHandler(async (req, res) => {
  const tour = await Tour.findById(req.params.id);

  if (!tour) {
    return res.status(404).json({
      success: false,
      message: 'Tour not found'
    });
  }

  // Check authorization
  if (tour.guide.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this tour'
    });
  }

  await tour.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Tour deleted successfully'
  });
});

export const getToursByGuide = asyncHandler(async (req, res) => {
  const tours = await Tour.find({ guide: req.params.guideId })
    .populate('guide', 'firstName lastName email avatar');

  res.status(200).json({
    success: true,
    count: tours.length,
    data: tours
  });
});

export const getToursByCity = asyncHandler(async (req, res) => {
  const tours = await Tour.find({ city: req.params.city })
    .populate('guide', 'firstName lastName email avatar');

  res.status(200).json({
    success: true,
    count: tours.length,
    data: tours
  });
});