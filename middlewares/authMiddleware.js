const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const TokenBlacklist = require("../models/tokenBlacklistModel");

const User = require("../models/userModel");

exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
  req.headers.authorization &&
  req.headers.authorization.startsWith("Bearer ")
) {
  token = req.headers.authorization.split(" ")[1];

  // 🔥 هون بالضبط
  const isBlacklisted = await TokenBlacklist.findOne({ token });

  if (isBlacklisted) {
    return res.status(401).json({
      status: "error",
      message: "Token expired, please login again",
    });
  }
}

  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "No token, unauthorized",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "User not found",
      });
    }

    req.user = {
  id: user._id,
  role: user.role,
};
    next();
  } catch (err) {
    return res.status(401).json({
      status: "error",
      message: "Invalid token",
    });
  }
});