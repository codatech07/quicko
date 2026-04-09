exports.successResponse = (res, message, data, statusCode = 200) => {
  return res.status(statusCode).json({ status: "success", message, data });
};
exports.errorResponse = (res, message, data, statusCode = 400) => {
  return res.status(statusCode).json({ status: "error", message, data });
};
exports.successCreateResponse = (res, message, statusCode = 201) => {
  return res.status(statusCode).json({ status: "success", message });
};

// CHECK AVAILABILITY RESPONSES
exports.successResponseForAvailability = (res, message, statusCode = 200) => {
  return res.status(statusCode).json({ message });
};
exports.errorResponseForAvailability = (res, message, statusCode = 409) => {
  return res.status(statusCode).json({ message });
};
exports.errorResponseForAvailabilityNoData = (
  res,
  message,
  statusCode = 400,
) => {
  return res.status(statusCode).json({ message });
};

// 400 error respone
exports.errorResponseForHandred = (
  res,
  message,
  statusCode = 400,
) => {
  return res.status(statusCode).json({ message });
};
