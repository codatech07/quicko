const User = require("../models/userModel");
const Product = require("../models/productModel"); 
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError"); 
const { successResponse } = require("../utils/response"); 

// TOGGLE FAVORITE (ADD / REMOVE)
exports.toggleFavorite = asyncHandler(async (req, res) => {
  // [AUTH] Extract authenticated user ID
  const userId = req.user.id;
  // [INPUT] Get productId from request params
  const { productId } = req.params;
  // [DB_FETCH] Retrieve user from database
  const user = await User.findById(userId);
  // [ERROR] User not found
  if (!user) {
    throw new AppError("User not found", 404);
  }
  // [DB_FETCH] Retrieve product
  const product = await Product.findById(productId);
  // [ERROR] Product not found
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  // [STATE] Result message
  let message;
  // [BUSINESS_LOGIC] Toggle favorite
  if (user.favorites.some(fav => fav.equals(productId))) {
    // [CHECK] Product already exists in favorites
    // [UPDATE] Remove product from favorites
    user.favorites.pull(productId);
    // [RESULT]
    message = "Removed from favorites";
  } else {
    // [CHECK] Product not in favorites
    // [UPDATE] Add product (no duplicates)
    user.favorites.addToSet(productId);
    // [RESULT]
    message = "Added to favorites";
  }
  // [DB_WRITE] Save updated user document
  await user.save();
  // [RESPONSE] Return updated favorites list
  return successResponse(res, message, user.favorites);
});


// GET FAVORITES
exports.getFavorites = asyncHandler(async (req, res) => {
  // [AUTH + DB_FETCH] Get user with populated favorites
  const user = await User.findById(req.user.id).populate("favorites");
  // [ERROR] User not found
  if (!user) {
    throw new AppError("User not found", 404);
  }
  // [SANITIZE] Remove null values (deleted products)
  const validFavorites = user.favorites.filter(p => p !== null);
  // [RESPONSE] Return favorites
  return successResponse(res, "Favorites fetched", validFavorites);
});