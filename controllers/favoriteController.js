const User = require("../models/userModel");
const Product = require("../models/productModel");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const { successResponse } = require("../utils/response");

// ➕ Add / Remove favorite (toggle)
exports.toggleFavorite = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  let message;

if (user.favorites.some(fav => fav.toString() === productId)) {
  user.favorites.pull(productId); // 🔥 remove
  message = "Removed from favorites";
} else {
  user.favorites.addToSet(productId); // 🔥 add بدون تكرار
  message = "Added to favorites";
}

await user.save();

  return successResponse(res, message, user.favorites);
});

// 📥 Get favorites list
exports.getFavorites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate("favorites");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return successResponse(res, "Favorites fetched", user.favorites);
});