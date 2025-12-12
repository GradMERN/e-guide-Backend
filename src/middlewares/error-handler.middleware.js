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

  // Handle MongoDB CastError (invalid ObjectId)
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 400;
    return res.status(statusCode).json({
      success: false,
      status: "fail",
      message: `Invalid ID format: ${err.value}`,
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

  // Handle Multer file upload errors
  if (err.name === "MulterError") {
    statusCode = 400;
    let message = "File upload error";
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File size too large";
    } else if (err.code === "LIMIT_FILE_COUNT") {
      message = "Too many files";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = "Unexpected file field";
    }
    return res.status(statusCode).json({
      success: false,
      status: "fail",
      message,
    });
  }

  // Handle Syntax errors (malformed JSON)
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      status: "fail",
      message: "Invalid JSON payload",
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
