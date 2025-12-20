import User from "../models/user.model.js";
import asyncHandler from "../utils/async-error-wrapper.utils.js";
import { ROLES } from "../utils/roles.utils.js";
import Tour from "../models/tour.model.js";
import Enrollment from "../models/enrollment.model.js";
import Payment from "../models/payment.model.js";

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find();

  res.status(200).json({ success: true, count: users.length, data: users });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.status(200).json({ success: true, data: user });
});

export const updateRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (req.user.id === req.params.id) {
    return res
      .status(403)
      .json({ success: false, message: "You cannot change your own role" });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (!Object.values(ROLES).includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role" });
  }

  user.role = role;
  await user.save();

  res.status(200).json({
    success: true,
    message: "User role updated successfully",
    data: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      updatedAt: user.updatedAt,
    },
  });
});

export const deleteUserAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (user._id.toString() === req.user.id) {
    return res
      .status(403)
      .json({ success: false, message: "You cannot delete your own account" });
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: "User account has been permanently deleted.",
  });
});

export const getDashboardStats = asyncHandler(async (req, res) => {
  const usersCount = await User.countDocuments();
  const guidesCount = await User.countDocuments({ role: ROLES.GUIDE });
  const adminsCount = await User.countDocuments({ role: ROLES.ADMIN });
  const toursCount = await Tour.countDocuments();
  const enrollmentsCount = await Enrollment.countDocuments();

  // Calculate total revenue (Platform takes 15% of all payments)
  const PLATFORM_COMMISSION = 0.15;
  const revenueAggregation = await Payment.aggregate([
    { $match: { status: "paid" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const totalPayments =
    revenueAggregation.length > 0 ? revenueAggregation[0].total : 0;
  const totalRevenue = Math.round(totalPayments * PLATFORM_COMMISSION);

  const recentUsers = await User.find()
    .sort("-createdAt")
    .limit(5)
    .select("firstName lastName email role createdAt");

  // Monthly Growth Data (Last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1); // Start of the month

  const getMonthlyCount = async (Model, filter = {}) => {
    return await Model.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          ...filter,
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      {
        $project: {
          _id: "$_id.month",
          year: "$_id.year",
          count: 1,
        },
      },
    ]);
  };

  const monthlyUsers = await getMonthlyCount(User);
  const monthlyGuides = await getMonthlyCount(User, { role: ROLES.GUIDE });
  const monthlyTours = await getMonthlyCount(Tour);

  // Monthly Revenue Data (Platform 15% commission)
  const monthlyRevenue = await Payment.aggregate([
    {
      $match: {
        status: "paid",
        createdAt: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
        revenue: { $sum: { $multiply: ["$amount", PLATFORM_COMMISSION] } },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    {
      $project: {
        _id: "$_id.month",
        year: "$_id.year",
        revenue: { $round: ["$revenue", 0] },
      },
    },
  ]);

  // Format data for frontend charts
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const currentMonth = new Date().getMonth();

  // Generate labels for the last 6 months
  const chartLabels = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    chartLabels.push(months[d.getMonth()]);
  }

  // Helper to map aggregation result to chart array
  const mapToChartData = (aggData, key = "count") => {
    const result = new Array(6).fill(0);
    aggData.forEach((item) => {
      // Calculate index based on month difference from current month
      // This is a simplified mapping, assuming the aggregation returns months in order and within the range
      // A more robust way would be to match month names
      const itemMonthIndex = item._id - 1; // 0-11
      // Find where this month fits in our chartLabels
      // This part can be tricky with year wrap around.
      // Let's just map by matching the month index to the last 6 months calculated above.

      for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        if (d.getMonth() === itemMonthIndex) {
          result[i] = item[key];
        }
      }
    });
    return result;
  };

  const userGrowthData = mapToChartData(monthlyUsers);
  const guideGrowthData = mapToChartData(monthlyGuides);
  const tourGrowthData = mapToChartData(monthlyTours);
  const revenueGrowthData = mapToChartData(monthlyRevenue, "revenue");

  const growthChartData = chartLabels.map((month, index) => ({
    month,
    users: userGrowthData[index],
    guides: guideGrowthData[index],
    tours: tourGrowthData[index],
  }));

  const revenueChartData = chartLabels.map((month, index) => ({
    month,
    revenue: revenueGrowthData[index],
  }));

  res.status(200).json({
    success: true,
    data: {
      usersCount,
      guidesCount,
      adminsCount,
      toursCount,
      enrollmentsCount,
      totalRevenue,
      recentUsers,
      growthChartData,
      revenueChartData,
    },
  });
});
