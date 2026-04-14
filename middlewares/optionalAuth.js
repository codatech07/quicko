const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // 👤 Guest
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("favorites");

    req.user = user || null;
  } catch (err) {
    req.user = null;
  }

  next();
};