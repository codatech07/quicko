const User = require("../models/userModel");

module.exports = async function attachFavorite(userId, products) {
  // إذا ما في منتجات
  if (!products) return products;

  // إذا ما في يوزر (no token)
  if (!userId) {
    if (Array.isArray(products)) {
      return products.map(p => ({
        ...p.toObject(),
        isFavorite: null,
      }));
    }

    return {
      ...products.toObject(),
      isFavorite: null,
    };
  }

  // نجيب favorites تبع المستخدم
  const user = await User.findById(userId).select("favorites");

  const favoriteIds = new Set(
    (user?.favorites || []).map(f => f.toString())
  );

  // إذا array
  if (Array.isArray(products)) {
    return products.map(p => ({
      ...p.toObject(),
      isFavorite: favoriteIds.has(p._id.toString()),
    }));
  }

  // إذا عنصر واحد
  return {
    ...products.toObject(),
    isFavorite: favoriteIds.has(products._id.toString()),
  };
};