const jwt = require("jsonwebtoken"); 
const asyncHandler = require("express-async-handler"); 
const User = require("../models/userModel"); 
const AppError = require("../utils/AppError");

// AUTH PROTECTION MIDDLEWARE
exports.protect = asyncHandler(async (req, res, next) => {
  // [TOKEN_INIT] Initialize token variable
  let token;
  // [TOKEN_EXTRACT] Get token from headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // [AUTH_CHECK] No token provided
  if (!token) {
    throw new AppError("No token, unauthorized", 401);
  }
  try {
    // [TOKEN_VERIFY] Decode & verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // [DB_FETCH] Get user from DB
    const user = await User.findById(decoded.id).select("-password");
    // [ERROR] User not found
    if (!user) {
      throw new AppError("User not found", 401);
    }
    // [ATTACH_USER] Attach user to request
    req.user = { id: user._id, role: user.role };
    // [NEXT] Continue to next middleware/controller
    next();
  } catch (err) {
    // [ERROR] Invalid or expired token
    throw new AppError("Invalid token", 401);
  }
});