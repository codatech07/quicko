const asyncHandler = require("express-async-handler");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const AppError = require("../utils/AppError");
const { successResponse } = require("../utils/response");

// add to card
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
      throw new AppError("Not enough stock", 400);
    }

    cart = await Cart.create({
      user: userId,
      items: [{ product: productId, quantity }],
    });

    return successResponse(res, "Cart created", cart);
  }

  const item = cart.items.find(i => i.product.toString() === productId);

  if (item) {
    const newQty = item.quantity + quantity;
    if (newQty > product.stock) {
      throw new AppError("Not enough stock", 400);
    }
    item.quantity = newQty;
  } else {
    if (quantity > product.stock) {
      throw new AppError("Not enough stock", 400);
    }

    cart.items.push({ product: productId, quantity });
  }

  await cart.save();

  return successResponse(res, "Product added to cart", cart);
});


// delete product from card 
exports.removeFromCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }
  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId
  );
  await cart.save();
  return successResponse(res, "Product removed from cart", cart);
});

// update product quantity in cart
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
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }
  const item = cart.items.find(
    (i) => i.product.toString() === productId
  );
  if (!item) {
    throw new AppError("Product not in cart", 404);
  }
  if (quantity === 0) {
    cart.items = cart.items.filter(
      (i) => i.product.toString() !== productId
    );
  } else {
    if (quantity > product.stock) {
      throw new AppError("Quantity exceeds stock", 400);
    }
    item.quantity = quantity;
  }
  await cart.save();
  return successResponse(res, "Cart updated", cart);
});



// // get user cart
// exports.getCart = asyncHandler(async (req, res) => {
//   const userId = req.user.id;
//   const cart = await Cart.findOne({ user: userId }).populate({
//     path: "items.product",
//     // ıf you wont to select from product you can add select
//     // select: "name description category price image stock",
//   });
//   // 🆕 إذا ما في كارت
//   if (!cart) {
//     return successResponse(res, "Cart is empty", {
//       items: [],
//       totalPrice: 0,
//     });
//   }
//   return successResponse(res, "Cart fetched successfully", cart);
// });


// exports.getCart = asyncHandler(async (req, res) => {
//   const userId = req.user.id;

//   const cart = await Cart.findOne({ user: userId }).populate({
//     path: "items.product",
//     // ıf you wont to select from product you can add select
//     // select: "name description category price image stock",
//   });
//   if (!cart) {
//     return successResponse(res, "Cart is empty", {
//       items: [],
//       totalPrice: 0,
//     });
//   }
//   // 💥 نحسب التوتال من product.price (ديناميكي)
//   const totalPrice = cart.items.reduce((total, item) => {
//     return total + item.product.price * item.quantity;
//   }, 0);
//   return successResponse(res, "Cart fetched successfully", {
//     ...cart.toObject(),
//     totalPrice,
//   });
// });


// exports.getCart = asyncHandler(async (req, res) => {
//   const userId = req.user.id;
//   const cart = await Cart.findOne({ user: userId }).populate("items.product");
//   if (!cart) {
//     return successResponse(res, "Cart is empty", {
//       items: [],
//       totalPrice: 0,
//     });
//   }
//   // 💥 LIVE PRICE (من المنتج مباشرة)
//   const totalPrice = cart.items.reduce((total, item) => {
//     return total + item.product.price * item.quantity;
//   }, 0);
//   return successResponse(res, "Cart fetched successfully", {
//     ...cart.toObject(),
//     totalPrice,
//   });
// });
exports.getCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const cart = await Cart.findOne({ user: userId }).populate("items.product");

  if (!cart) {
    return successResponse(res, "Cart is empty", {
      items: [],
      totalPrice: 0,
    });
  }

  const items = cart.items.map(item => {
    return {
      product: item.product,
      quantity: item.quantity,
      subtotal: item.quantity * item.product.price, // 🔥 ديناميكي
    };
  });

  const totalPrice = items.reduce((t, i) => t + i.subtotal, 0);

  return successResponse(res, "Cart fetched successfully", {
    _id: cart._id,
    user: cart.user,
    items,
    totalPrice,
    updatedAt: cart.updatedAt,
  });
});