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

// update product quantity in cart
exports.updateCartItem = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;
  const { quantity } = req.body;

  // ❌ لازم المستخدم يبعث quantity
  if (quantity === undefined) {
    throw new AppError("Quantity is required", 400);
  }

  if (quantity < 0) {
    throw new AppError("Quantity cannot be negative", 400);
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const item = cart.items.find(
    (i) => i.product.toString() === productId
  );

  if (!item) {
    throw new AppError("Product not in cart", 404);
  }

  // ❌ إذا صفر نحذف
  if (quantity === 0) {
    cart.items = cart.items.filter(
      (i) => i.product.toString() !== productId
    );
  } else {
    // ❌ تحقق من الستوك
    if (quantity > product.stock) {
      throw new AppError("Quantity exceeds stock", 400);
    }

    item.quantity = quantity;
  }

  // 💰 إعادة الحساب
  cart.totalPrice = cart.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  await cart.save();

  return successResponse(res, "Cart updated", cart);
});



// get user cart
exports.getCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const cart = await Cart.findOne({ user: userId }).populate({
    path: "items.product",
    // ıf you wont to select from product you can add select
    // select: "name description category price image stock",
  });
  // 🆕 إذا ما في كارت
  if (!cart) {
    return successResponse(res, "Cart is empty", {
      items: [],
      totalPrice: 0,
    });
  }
  return successResponse(res, "Cart fetched successfully", cart);
});