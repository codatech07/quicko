const express = require("express");
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyOTP,
  verifyEmail,
  logout,
  checkAvailability,
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware.js");
const { authLimiter } = require("../middlewares/rateLimitMiddleware");
const router = express.Router();
router.post("/register",authLimiter, register);
router.post("/login",authLimiter, login);
router.post("/forgot-password",authLimiter, forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);
router.post("/verify-email", verifyEmail);
router.post("/logout", protect, logout);
// CHECK AVAILABILITY
router.get("/check-availability", checkAvailability);
// Route protected
const User = require("../models/userModel");
router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res
    .status(200)
    .json({ status: "success", message: "Accessed successfully", user });
});
module.exports = router;
