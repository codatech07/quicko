const express = require("express");
const router = express.Router();

const { addToCart,removeFromCart } = require("../controllers/cartController");
const { protect } = require("../middlewares/authMiddleware");

// ➕ add to cart
router.post("/:productId", protect, addToCart);
// remove from card
router.delete("/:productId", protect, removeFromCart);

module.exports = router;