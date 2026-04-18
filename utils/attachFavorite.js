const User = require("../models/userModel");

// FAVORITE ATTACH UTILITY
// Adds isFavorite flag to products based on user
module.exports = async function attachFavorite(userId, products) {
  // [EDGE_CASE] No products provided
  if (!products) return products;

  // [GUEST_USER] No logged-in user
  if (!userId) {
    // [ARRAY_CASE] Multiple products
    if (Array.isArray(products)) {
      return products.map((p) => ({
        ...p.toObject(),
        isFavorite: null, // unknown for guests
      }));
    }
    // [SINGLE_CASE] One product
    return {
      ...products.toObject(),
      isFavorite: null,
    };
  }

  // [DB_FETCH] Get user favorites
  const user = await User.findById(userId).select("favorites");
  // [OPTIMIZATION] Convert favorites to Set for fast lookup
  const favoriteIds = new Set((user?.favorites || []).map((f) => f.toString()));
  // [ARRAY_CASE] Multiple products
  if (Array.isArray(products)) {
    return products.map((p) => ({
      ...p.toObject(),
      isFavorite: favoriteIds.has(p._id.toString()),
    }));
  }
  // [SINGLE_CASE] Single product
  return {
    ...products.toObject(),
    isFavorite: favoriteIds.has(products._id.toString()),
  };
};
