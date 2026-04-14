const express = require("express");
const router = express.Router();

const { addToCart,removeFromCart,updateCartItem,getCart } = require("../controllers/cartController");
const { protect } = require("../middlewares/authMiddleware");

// add to cart
router.post("/:productId", protect, addToCart);
// remove from card
router.delete("/:productId", protect, removeFromCart);
// update product in card 
router.patch("/:productId", protect, updateCartItem);
// get user cart
router.get("/", protect, getCart); 

module.exports = router;