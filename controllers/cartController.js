const asyncHandler = require("express-async-handler");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const AppError = require("../utils/AppError");
const { successResponse } = require("../utils/response");

// 🧹 CLEAN CART HELPER
const cleanCart = async (cart) => {
  cart.items = cart.items.filter((item) => item.product);
  return cart;
};

// ADD TO CART
exports.addToCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;
  const quantity = Number(req.body?.quantity) || 1;
  if (quantity <= 0) {
    throw new AppError("Quantity must be at least 1", 400);
  }
  const product = await Product.findById(productId);
  if (!product) throw new AppError("Product not found", 404);
  if (product.stock === 0) {
    throw new AppError("Product is out of stock", 400);
  }
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    if (quantity > product.stock) {
      throw new AppError("Not enough stock available", 400);
    }
    cart = await Cart.create({
      user: userId,
      items: [{ product: productId, quantity }],
    });
  } else {
    const item = cart.items.find((i) => i.product.toString() === productId);
    if (item) {
      const newQty = item.quantity + quantity;
      if (newQty > product.stock) {
        throw new AppError("Quantity exceeds stock", 400);
      }
      item.quantity = newQty;
    } else {
      if (quantity > product.stock) {
        throw new AppError("Not enough stock available", 400);
      }
      cart.items.push({ product: productId, quantity });
    }
    await cart.save();
  }
  await cart.populate("items.product");
  cart = await cleanCart(cart);
  const totalPrice = cart.items.reduce(
    (t, i) => t + i.quantity * i.product.price,
    0,
  );
  return successResponse(res, "Product added to cart", {
    ...cart.toObject(),
    totalPrice,
  });
});

// REMOVE FROM CART
exports.removeFromCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;
  let cart = await Cart.findOne({ user: userId });
  if (!cart) throw new AppError("Cart not found", 404);
  const index = cart.items.findIndex((i) => i.product.toString() === productId);
  if (index === -1) {
    throw new AppError("Product not in cart", 404);
  }
  cart.items.splice(index, 1);
  await cart.save();
  await cart.populate("items.product");
  cart = await cleanCart(cart);
  const totalPrice = cart.items.reduce(
    (t, i) => t + i.quantity * i.product.price,
    0,
  );
  return successResponse(res, "Product removed from cart", {
    ...cart.toObject(),
    totalPrice,
  });
});

// UPDATE CART ITEM
exports.updateCartItem = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;
  const { quantity } = req.body;
  if (quantity === undefined) {
    throw new AppError("Quantity is required", 400);
  }
  if (quantity < 0) {
    throw new AppError("Quantity cannot be negative", 400);
  }
  let cart = await Cart.findOne({ user: userId });
  if (!cart) throw new AppError("Cart not found", 404);
  const product = await Product.findById(productId);
  if (!product) throw new AppError("Product not found", 404);
  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) throw new AppError("Product not in cart", 404);
  if (quantity === 0) {
    cart.items = cart.items.filter((i) => i.product.toString() !== productId);
  } else {
    if (quantity > product.stock) {
      throw new AppError("Quantity exceeds stock", 400);
    }
    item.quantity = quantity;
  }
  await cart.save();
  await cart.populate("items.product");
  cart = await cleanCart(cart);
  const totalPrice = cart.items.reduce(
    (t, i) => t + i.quantity * i.product.price,
    0,
  );
  return successResponse(res, "Cart updated", {
    ...cart.toObject(),
    totalPrice,
  });
});

// GET CART
exports.getCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  let cart = await Cart.findOne({ user: userId }).populate(
    // {
    //   // if you want to select you can add this
    //   path: "items.product",
    //   select: "name price images",
    // }
    "items.product",
  );
  if (!cart) {
    return successResponse(res, "Cart is empty", {
      items: [],
      totalPrice: 0,
    });
  }
  cart = await cleanCart(cart);
  const items = cart.items.map((item) => ({
    product: item.product,
    quantity: item.quantity,
    subtotal: item.quantity * item.product.price,
  }));
  const totalPrice = items.reduce((t, i) => t + i.subtotal, 0);
  return successResponse(res, "Cart fetched successfully", {
    _id: cart._id,
    user: cart.user,
    items,
    totalPrice,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  });
});

// EMPTY CART (clear all items)
exports.clearCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }
  // تفريغ كل العناصر
  cart.items = [];
  // إعادة حساب التوتال
  cart.totalPrice = 0;
  await cart.save();
  return successResponse(res, "Cart cleared successfully", {
    _id: cart._id,
    user: cart.user,
    items: [],
    totalPrice: 0,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  });
});
