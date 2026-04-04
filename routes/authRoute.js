const express = require("express");
const { register, login } = require("../controllers/authController.js");
const { protect } = require("../middlewares/authMiddleware.js");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

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
