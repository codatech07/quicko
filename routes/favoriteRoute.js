const express = require("express");
const router = express.Router();

const {
  toggleFavorite,
  getFavorites,
} = require("../controllers/favoriteController");

const { protect } = require("../middlewares/authMiddleware");

// add/remove favorite
router.post("/:productId", protect, toggleFavorite);

// get favorites
router.get("/", protect, getFavorites);

module.exports = router;