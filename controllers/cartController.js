const asyncHandler = require("express-async-handler");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const AppError = require("../utils/AppError");
const { successResponse } = require("../utils/response");




// ➕ Add to cart (STEP 1 فقط)
exports.addToCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;
  const { quantity = 1 } = req.body;
  // 1. تأكد المنتج موجود
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  // 2. جيب الكارت أو أنشئ واحد
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [],
      totalPrice: 0,
    });
  }
  // 3. هل المنتج موجود بالكارت؟
  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );
  if (itemIndex > -1) {
    // إذا موجود → زيد الكمية فقط
    cart.items[itemIndex].quantity += quantity;
  } else {
    // إذا جديد → ضيفه
    cart.items.push({
      product: productId,
      quantity,
      price: product.price,
    });
  }
  // 4. احسب totalPrice
  cart.totalPrice = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  await cart.save();
  return successResponse(res, "Added to cart", cart);
});