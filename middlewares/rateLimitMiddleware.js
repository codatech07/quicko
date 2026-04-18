const rateLimit = require("express-rate-limit");

// قراءة القيم من .env
const WINDOW_MIN = parseInt(process.env.RATE_LIMIT_WINDOW_MIN) || 15;
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX) || 100;

// تحويل الدقائق إلى milliseconds
const windowMs = WINDOW_MIN * 60 * 1000;

// إنشاء limiter
const globalLimiter = rateLimit({
  windowMs: windowMs,
  max: MAX_REQUESTS,
  message: {
    status: "error",
    message: "Too many requests, please try again later",
  },
});

module.exports = {
  globalLimiter,
};