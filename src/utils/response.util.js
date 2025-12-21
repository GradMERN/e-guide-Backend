export const sendSuccess = (
  res,
  statusCode,
  message,
  data = null,
  meta = {}
) => {
  return res.status(statusCode).json({
    success: true,
    status: "success",
    message,
    ...(data !== null && { data }),
    ...(Object.keys(meta).length > 0 && { meta }),
  });
};

export const sendError = (res, statusCode, message, details = {}) => {
  return res.status(statusCode).json({
    success: false,
    status: "fail",
    message,
    ...(Object.keys(details).length > 0 && { details }),
  });
};

export const sendPaginated = (
  res,
  statusCode,
  message,
  data,
  pagination = {}
) => {
  return res.status(statusCode).json({
    success: true,
    status: "success",
    message,
    data,
    pagination: {
      total: pagination.total || 0,
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      pages: pagination.pages || 1,
      ...pagination,
    },
  });
};
