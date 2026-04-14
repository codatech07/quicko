const asyncHandler = require("express-async-handler");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const AppError = require("../utils/AppError");
const { successResponse } = require("../utils/response");

exports.addToCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;
  let { quantity } = req.body;

  // 🧠 default quantity
  if (!quantity) quantity = 1;
  quantity = Number(quantity);

  if (quantity <= 0) {
    throw new AppError("Quantity must be >= 1", 400);
  }

  // 🔍 check product
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // 🛒 get or create cart
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
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

    return successResponse(res, "Cart created", cart);
  }

  // 🔁 check product exists
  const item = cart.items.find(
    (i) => i.product.toString() === productId
  );

  if (item) {
    item.quantity += quantity;
  } else {
    cart.items.push({
      product: productId,
      quantity,
      price: product.price,
    });
  }

  // 💰 update total
  cart.totalPrice = cart.items.reduce((sum, i) => {
    return sum + i.price * i.quantity;
  }, 0);

  await cart.save();

  return successResponse(res, "Added to cart", cart);
});