const asyncHandler = require("express-async-handler");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const AppError = require("../utils/AppError");
const { successResponse } = require("../utils/response");


// 🧹 CLEAN CART HELPER
const cleanCart = async (cart) => {
  // [SANITIZE] Remove items with deleted products
  cart.items = cart.items.filter((item) => item.product);

  return cart;
};

// ADD TO CART
exports.addToCart = asyncHandler(async (req, res) => {
  // [AUTH]
  const userId = req.user.id;
  // [INPUT]
  const { productId } = req.params;
  const quantity = Number(req.body?.quantity) || 1;
  // [VALIDATION] Quantity check
  if (quantity <= 0) {
    throw new AppError("Quantity must be at least 1", 400);
  }
  // [DB_FETCH] Get product
  const product = await Product.findById(productId);
  // [ERROR] Product not found
  if (!product) throw new AppError("Product not found", 404);
  // [BUSINESS_LOGIC] Stock check
  if (product.stock === 0) {
    throw new AppError("Product is out of stock", 400);
  }
  // [DB_FETCH] Get user's cart
  let cart = await Cart.findOne({ user: userId });

  // [FLOW] Create new cart
  if (!cart) {
    // [VALIDATION] Stock limit
    if (quantity > product.stock) {
      throw new AppError("Not enough stock available", 400);
    }
    // [DB_WRITE] Create cart
    cart = await Cart.create({
      user: userId,
      items: [{ product: productId, quantity }],
    });
  } else {
    // [FLOW] Update existing cart
    // [BUSINESS_LOGIC] Check if item exists
    const item = cart.items.find(
      (i) => i.product.toString() === productId,
    );
    if (item) {
      // [CALCULATION] New quantity
      const newQty = item.quantity + quantity;
      // [VALIDATION] Stock limit
      if (newQty > product.stock) {
        throw new AppError("Quantity exceeds stock", 400);
      }
      // [UPDATE]
      item.quantity = newQty;
    } else {
      // [VALIDATION]
      if (quantity > product.stock) {
        throw new AppError("Not enough stock available", 400);
      }
      // [UPDATE] Add new item
      cart.items.push({ product: productId, quantity });
    }
    // [DB_WRITE] Save cart
    await cart.save();
  }
  // [DB_POPULATE] Populate product data
  await cart.populate("items.product");
  // [SANITIZE]
  cart = await cleanCart(cart);
  // [CALCULATION] Total price
  const totalPrice = cart.items.reduce(
    (t, i) => t + i.quantity * i.product.price,
    0,
  );
  // [RESPONSE]
  return successResponse(res, "Product added to cart", {
    ...cart.toObject(),
    totalPrice,
  });
});


// REMOVE FROM CART
exports.removeFromCart = asyncHandler(async (req, res) => {
  // [AUTH]
  const userId = req.user.id;
  // [INPUT]
  const { productId } = req.params;
  // [DB_FETCH]
  let cart = await Cart.findOne({ user: userId });
  // [ERROR]
  if (!cart) throw new AppError("Cart not found", 404);
  // [BUSINESS_LOGIC] Find item index
  const index = cart.items.findIndex(
    (i) => i.product.toString() === productId,
  );
  // [ERROR]
  if (index === -1) {
    throw new AppError("Product not in cart", 404);
  }
  // [UPDATE] Remove item
  cart.items.splice(index, 1);
  // [DB_WRITE]
  await cart.save();
  // [DB_POPULATE]
  await cart.populate("items.product");
  // [SANITIZE]
  cart = await cleanCart(cart);
  // [CALCULATION]
  const totalPrice = cart.items.reduce(
    (t, i) => t + i.quantity * i.product.price,
    0,
  );
  // [RESPONSE]
  return successResponse(res, "Product removed from cart", {
    ...cart.toObject(),
    totalPrice,
  });
});

// UPDATE CART ITEM
exports.updateCartItem = asyncHandler(async (req, res) => {
  // [AUTH]
  const userId = req.user.id;
  // [INPUT]
  const { productId } = req.params;
  const { quantity } = req.body;
  // [VALIDATION]
  if (quantity === undefined) {
    throw new AppError("Quantity is required", 400);
  }
  if (quantity < 0) {
    throw new AppError("Quantity cannot be negative", 400);
  }
  // [DB_FETCH]
  let cart = await Cart.findOne({ user: userId });
  if (!cart) throw new AppError("Cart not found", 404);
  // [DB_FETCH] Product
  const product = await Product.findById(productId);
  if (!product) throw new AppError("Product not found", 404);
  // [BUSINESS_LOGIC]
  const item = cart.items.find(
    (i) => i.product.toString() === productId,
  );
  if (!item) throw new AppError("Product not in cart", 404);
  // [FLOW] Remove item if quantity = 0
  if (quantity === 0) {
    cart.items = cart.items.filter(
      (i) => i.product.toString() !== productId,
    );
  } else {
    // [VALIDATION]
    if (quantity > product.stock) {
      throw new AppError("Quantity exceeds stock", 400);
    }
    // [UPDATE]
    item.quantity = quantity;
  }
  // [DB_WRITE]
  await cart.save();
  // [DB_POPULATE]
  await cart.populate("items.product");
  // [SANITIZE]
  cart = await cleanCart(cart);
  // [CALCULATION]
  const totalPrice = cart.items.reduce(
    (t, i) => t + i.quantity * i.product.price,
    0,
  );
  // [RESPONSE]
  return successResponse(res, "Cart updated", {
    ...cart.toObject(),
    totalPrice,
  });
});


// GET CART
exports.getCart = asyncHandler(async (req, res) => {
  // [AUTH]
  const userId = req.user.id;
  // [DB_FETCH]
  let cart = await Cart.findOne({ user: userId }).populate("items.product");
  // [EMPTY_CASE]
  if (!cart) {
    return successResponse(res, "Cart is empty", {
      items: [],
      totalPrice: 0,
    });
  }
  // [SANITIZE]
  cart = await cleanCart(cart);
  // [TRANSFORM] Format items
  const items = cart.items.map((item) => ({
    product: item.product,
    quantity: item.quantity,
    subtotal: item.quantity * item.product.price,
  }));
  // [CALCULATION]
  const totalPrice = items.reduce((t, i) => t + i.subtotal, 0);
  // [RESPONSE]
  return successResponse(res, "Cart fetched successfully", {
    _id: cart._id,
    user: cart.user,
    items,
    totalPrice,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  });
});

// CLEAR CART
exports.clearCart = asyncHandler(async (req, res) => {
  // [AUTH]
  const userId = req.user.id;
  // [DB_FETCH]
  const cart = await Cart.findOne({ user: userId });
  // [ERROR]
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }
  // [UPDATE] Clear items
  cart.items = [];
  // [RESET] Total price
  cart.totalPrice = 0;
  // [DB_WRITE]
  await cart.save();
  // [RESPONSE]
  return successResponse(res, "Cart cleared successfully", {
    _id: cart._id,
    user: cart.user,
    items: [],
    totalPrice: 0,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  });
});