const express = require("express");
const { register, login } = require("../controllers/authController.js");
const { protect } = require("../middlewares/authMiddleware.js");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

// Route protected
router.get("/me", protect, (req, res) => {
  res.json({
    message: "Accessed successfully",
    user: req.user,
  });
});

module.exports = router;
