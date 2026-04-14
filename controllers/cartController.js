const asyncHandler = require("express-async-handler");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const AppError = require("../utils/AppError");
const { successResponse } = require("../utils/response");

exports.addToCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  // ✅ أهم سطر (حل مشكلتك كلها)
  const quantity = Number(req.body?.quantity) || 1;

  if (quantity <= 0) {
    throw new AppError("Quantity must be at least 1", 400);
  }

  // 🔍 تأكد المنتج موجود
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // 🛒 جيب الكارت
  let cart = await Cart.findOne({ user: userId });

  // 🆕 إذا ما في كارت → أنشئ
  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [
        {
          product: productId,
          quantity: quantity,
          price: product.price,
        },
      ],
      totalPrice: product.price * quantity,
    });

    return successResponse(res, "Cart created & product added", cart);
  }

  // 🔁 شوف إذا المنتج موجود بالكارت
  const item = cart.items.find(
    (i) => i.product.toString() === productId
  );

  if (item) {
    // ➕ زيد الكمية
    item.quantity += quantity;
  } else {
    // 🆕 أضف المنتج
    cart.items.push({
      product: productId,
      quantity: quantity,
      price: product.price,
    });
  }

  // 💰 حساب السعر الكلي
  cart.totalPrice = cart.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  await cart.save();

  return successResponse(res, "Product added to cart", cart);
});