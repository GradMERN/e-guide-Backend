import { verifyToken } from "../utils/jwt.utils.js";
import asyncHandler from "../utils/async-error-wrapper.utils.js";
import User from "../models/user.model.js";

export const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
  }

  const decoded = verifyToken(token);

  const userId = decoded.id || decoded._id;

  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "invalid token payload" });
  }

  const user = await User.findOne({ _id: userId, active: true }).select(
    "-password +passwordChangedAt"
  );

  if (!user) {
    return res
      .status(401)
      .json({ success: false, message: "User not found or not active" });
  }
  if (user.passwordChangedBefore(decoded.iat)) {
    return res
      .status(401)
      .json({ success: false, message: "invalid token payload" });
  }
  req.user = user;

  next();
});

/**
 * Role-based authorization middleware
 * Must be used after authMiddleware middleware
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        status: "fail",
        message: "Not authMiddlewared",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        status: "fail",
        message: "Not authorized to access this resource",
      });
    }

    next();
  };
};
