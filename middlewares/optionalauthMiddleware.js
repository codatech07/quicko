const jwt = require("jsonwebtoken"); 
const User = require("../models/userModel"); 
const asyncHandler = require("express-async-handler");

// OPTIONAL AUTH MIDDLEWARE
exports.optionalAuth = asyncHandler(async (req, res, next) => {

  // [TOKEN_INIT] Initialize token
  let token;

  // [TOKEN_EXTRACT] Try to get token (if exists)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
    try {
      // [TOKEN_VERIFY] Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // [DB_FETCH] Get user from DB
      const user = await User.findById(decoded.id).select("-password");

      // [ATTACH_USER] Attach user if valid
      if (user) {
        req.user = { id: user._id, role: user.role };
      }

    } catch (err) {
      // [IGNORE_ERROR] Invalid token is ignored
      // do nothing → continue without user
    }
  }

  // [NEXT] Continue always (with or without user)
  next();
});