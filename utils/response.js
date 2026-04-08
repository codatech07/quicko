exports.successResponse = (res, message, data, statusCode = 200) => {
  return res.status(statusCode).json({ status: "success", message, data });
};
exports.errorResponse = (res, message, data, statusCode = 400) => {
  return res.status(statusCode).json({ status: "error", message, data });
};
exports.successCreateResponse = (res, message, statusCode = 201) => {
  return res.status(statusCode).json({ status: "success", message });
};
