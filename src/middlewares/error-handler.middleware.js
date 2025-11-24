export const errorHandler = (err, req, res, next) => {
  console.error("Error: ", err.stack || err.message);

  // Determine status code
  let statusCode = err.statusCode || res.statusCode || 500;
  if (statusCode === 200) statusCode = 500;

  // Handle MongoDB validation errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    return res.status(statusCode).json({
      success: false,
      status: "fail",
      message,
    });
  }

  // Handle MongoDB duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    return res.status(statusCode).json({
      success: false,
      status: "fail",
      message: `${field} already exists`,
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    return res.status(statusCode).json({
      success: false,
      status: "fail",
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    return res.status(statusCode).json({
      success: false,
      status: "fail",
      message: "Token expired",
    });
  }

  // Default error response
  res.status(statusCode).json({
    success: false,
    status: "error",
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
