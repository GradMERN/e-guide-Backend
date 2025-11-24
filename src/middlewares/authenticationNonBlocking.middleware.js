import { verifyToken } from "../utils/jwt.utils.js";
import asyncHandler from "../utils/async-error-wrapper.utils.js";
import User from "../models/user.model.js";

export const authNonBlockingMiddleware = asyncHandler(
  async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      next();
      return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      next();
      return;
    }

    const decoded = verifyToken(token);

    const userId = decoded.id || decoded._id;

    if (!userId) {
      next();
      return;
    }

    const user = await User.findOne({ _id: userId, active: true }).select(
      "-password +passwordChangedAt"
    );

    if (user && !user.passwordChangedBefore(decoded.iat)) {
      req.user = user;
    }

    next();
  }
);
