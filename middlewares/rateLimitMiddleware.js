const rateLimit = require("express-rate-limit");

// قراءة القيم من .env
const WINDOW_MIN = parseInt(process.env.RATE_LIMIT_TIME_MINUTES) || 15;
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_REQUESTS) || 100;
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

// AUTH limiter
const authTime = parseInt(process.env.AUTH_RATE_LIMIT_TIME_MINUTES) || 10;
const authMax = parseInt(process.env.AUTH_RATE_LIMIT_REQUESTS) || 10;
const authWindowMs = authTime * 60 * 1000;
const authLimiter = rateLimit({
  windowMs: authWindowMs,
  max: authMax,
  message: {
    status: "error",
    message: "Too many authentication attempts, please try again later",
  },
});

module.exports = {
  globalLimiter,
  authLimiter,
};