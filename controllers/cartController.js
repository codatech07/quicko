const asyncHandler = require("express-async-handler");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const AppError = require("../utils/AppError");
const { successResponse } = require("../utils/response");

exports.addToCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  const quantity = Number(req.body?.quantity) || 1;

  if (quantity <= 0) {
    throw new AppError("Quantity must be at least 1", 400);
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // ❌ إذا المنتج خالص
  if (product.stock === 0) {
    throw new AppError("Product is out of stock", 400);
  }

  let cart = await Cart.findOne({ user: userId });

  // 🆕 create cart
  if (!cart) {
    // ❌ check stock
    if (quantity > product.stock) {
      throw new AppError("Not enough stock available", 400);
    }

    cart = await Cart.create({
      user: userId,
      items: [
        {
          product: productId,
          quantity,
          price: product.price,
        },
      ],
      totalPrice: product.price * quantity,
    });

    return successResponse(res, "Cart created & product added", cart);
  }

  const item = cart.items.find(
    (i) => i.product.toString() === productId
  );

  if (item) {
    // ❌ تحقق من الكمية الجديدة
    const newQuantity = item.quantity + quantity;

    if (newQuantity > product.stock) {
      throw new AppError("Quantity exceeds available stock", 400);
    }

    item.quantity = newQuantity;
  } else {
    // ❌ تحقق للمنتج الجديد
    if (quantity > product.stock) {
      throw new AppError("Not enough stock available", 400);
    }

    cart.items.push({
      product: productId,
      quantity,
      price: product.price,
    });
  }

  // 💰 total
  cart.totalPrice = cart.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  await cart.save();

  return successResponse(res, "Product added to cart", cart);
});


// delete product from card 
exports.removeFromCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  // 🛒 جيب الكارت
  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  // 🔍 تحقق إذا المنتج موجود
  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (itemIndex === -1) {
    throw new AppError("Product not in cart", 404);
  }

  // ❌ حذف المنتج
  cart.items.splice(itemIndex, 1);

  // 💰 إعادة حساب السعر
  cart.totalPrice = cart.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  await cart.save();

  return successResponse(res, "Product removed from cart", cart);
});