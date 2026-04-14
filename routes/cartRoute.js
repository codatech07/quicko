const express = require("express");
const router = express.Router();

const { addToCart } = require("../controllers/cartController");
const { protect } = require("../middlewares/authMiddleware");

// ➕ add to cart
router.post("/:productId", protect, addToCart);

module.exports = router;