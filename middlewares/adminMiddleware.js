const asyncHandler = require("express-async-handler"); 
const AppError = require("../utils/AppError"); 

// ADMIN AUTHORIZATION MIDDLEWARE
exports.isAdmin = asyncHandler(async (req, res, next) => {
  // [AUTH_CHECK] Verify user is logged in
  if (!req.user) {
    throw new AppError("Not logged in", 401);
  }
  // [ROLE_CHECK] Verify user has admin role
  if (req.user.role !== "admin") {
    throw new AppError("Not allowed, admin privileges required", 403);
  }
  // [NEXT] User is authorized → move to next middleware/controller
  next();
});