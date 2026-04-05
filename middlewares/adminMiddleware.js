const asyncHandler = require("express-async-handler");

//  Admin verification
exports.isAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Not logged in",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
  status: "error",
  message: "Not allowed, admin privileges required",
});
  }

  next();
});