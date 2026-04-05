const express = require("express");
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyOTP,
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware.js");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

// Route protected
const User = require("../models/userModel");

router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  res.status(200).json({
    status: "success",
    message: "Accessed successfully",
    user,
  });
});

module.exports = router;
