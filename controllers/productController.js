const Product = require("../models/productModel");
const Shop = require("../models/shopModel");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const { successResponse } = require("../utils/response");

//  create product
exports.createProduct = asyncHandler(async (req, res) => {
  let { name, description, category, price, oldPrice, stock, images } =
    req.body;

  const shopId = req.params.shopId; // 🔥 من URL

  // 🛑 required
  if (!name || !description || !category || !price || !images || !stock) {
    throw new AppError("All required fields must be provided", 400);
  }

  // 🧹 clean
  name = name.trim();
  description = description.trim();
  category = category.trim();

  // 🖼️ normalize images
  const imagesArray = Array.isArray(images) ? images : [images];

  // 🏪 check shop exists
  const shopExists = await Shop.findById(shopId);
  if (!shopExists) {
    throw new AppError("Shop not found", 404);
  }

  // 💾 create
  const product = await Product.create({
    name,
    description,
    category,
    price,
    oldPrice,
    stock,
    images: imagesArray,
    shop: shopId, // 🔥 تلقائي
  });

  return successResponse(res, "Product created successfully", product, 201);
});