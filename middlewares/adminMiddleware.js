const asyncHandler = require("express-async-handler");
// Admin verification
exports.isAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new AppError("Not logged in", 401);
  }
  if (req.user.role !== "admin") {
    throw new AppError("Not allowed, admin privileges required", 403);
  }
  next();
});
