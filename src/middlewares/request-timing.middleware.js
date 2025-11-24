import { logger } from "../utils/logger.util.js";

/**
 * Request/Response timing middleware
 * Logs API request/response duration and basic metrics
 */
export const requestTimingMiddleware = (req, res, next) => {
  const startTime = Date.now();

  // Store original send function
  const originalSend = res.send;

  // Override send function to log response
  res.send = function (data) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    logger.info(`${req.method} ${req.path}`, {
      statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?._id || "anonymous",
    });

    // Call original send
    originalSend.call(this, data);
  };

  next();
};
