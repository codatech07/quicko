const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const AppError = require("../utils/AppError");

exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    throw new AppError("No token, unauthorized", 401);
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      throw new AppError("User not found", 401);
    }
    req.user = { id: user._id, role: user.role };
    next();
  } catch (err) {
    throw new AppError("Invalid token", 401);
  }
});
