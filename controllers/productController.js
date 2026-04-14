const Product = require("../models/productModel");
const Shop = require("../models/shopModel");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const { successResponse } = require("../utils/response");
const attachFavorite = require("../utils/attachFavorite");
const User = require("../models/userModel");




//  create product
exports.createProduct = asyncHandler(async (req, res) => {
  let { name, description, category, price, oldPrice, stock, images,currency,
  unit } =
    req.body;

  const shopId = req.params.shopId; // 🔥 من URL

  // 🛑 required
  if (
  !name ||
  !description ||
  !category ||
  price == null ||
  stock == null ||
  !currency ||
  !unit ||!req.files ||
  req.files.length === 0
) {
    throw new AppError("All required fields must be provided", 400);
  }

  // 🧹 clean
  name = name.trim();
  description = description.trim();
  category = category.trim();

  // 🖼️ normalize images
  // const imagesArray = Array.isArray(images) ? images : [images];
  const imagesArray = req.files.map((file) => file.path);

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
    shop: shopId,
  currency,
  unit, // 🔥 تلقائي
  });

  return successResponse(res, "Product created successfully", product, 201);
});

// get Shop Products
// get Shop Products
exports.getShopProducts = asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  let { page, limit, sort, category } = req.query;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 14;
  const skip = (page - 1) * limit;

  const shopExists = await Shop.findById(shopId);
  if (!shopExists) {
    throw new AppError("Shop not found", 404);
  }

  let filter = { shop: shopId };
  if (category) filter.category = category;

  let sortOption = {};

  switch (sort) {
    case "newest":
      sortOption = { createdAt: -1 };
      break;
    case "oldest":
      sortOption = { createdAt: 1 };
      break;
    case "price_asc":
      sortOption = { price: 1 };
      break;
    case "price_desc":
      sortOption = { price: -1 };
      break;
    case "best_selling":
      sortOption = { sold: -1 };
      break;
    case "most_viewed":
      sortOption = { views: -1 };
      break;
    default:
      sortOption = { createdAt: -1 };
  }

  const products = await Product.find(filter)
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  const total = await Product.countDocuments(filter);

  const userId = req.user?.id || null;
  const productsWithFavorite = await attachFavorite(userId, products);

  return successResponse(res, "Products fetched successfully", {
    total,
    page,
    pages: Math.ceil(total / limit),
    results: products.length,
    products: productsWithFavorite,
  });
});

// get Product by id
exports.getProductById = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user?.id || null;

  let product = await Product.findById(productId).populate("shop");

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  product.views += 1;
  await product.save();

  const productWithFavorite = await attachFavorite(userId, product);

  return successResponse(res, "Product fetched successfully", productWithFavorite);
});

// update product
exports.updateProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  let {
    name,
    description,
    category,
    price,
    oldPrice,
    stock,
    images,currency, unit
  } = req.body;

  if (name) product.name = name.trim();
  if (description) product.description = description.trim();
  if (category) product.category = category.trim();
  if (price != null) product.price = price;
  if (oldPrice != null) product.oldPrice = oldPrice;
  if (stock != null) product.stock = stock;
  if (currency) product.currency = currency;
if (unit) product.unit = unit;

  if (req.files && req.files.length > 0) {
  const imagesArray = req.files.map((file) => file.path);
  product.images = imagesArray;
}
  await product.save();
  return successResponse(res, "Product updated successfully", product);
});

// delete product
exports.deleteProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }
   // 🔥 احذف المنتج من favorites عند كل المستخدمين
  await User.updateMany(
    { favorites: productId },
    { $pull: { favorites: productId } }
  );
  await product.deleteOne();
  return successResponse(res, "Product deleted successfully");
});

// get all product
exports.getAllProducts = asyncHandler(async (req, res) => {
  //11111
  const userId = req.user?.id
  let { page, limit, sort, category, search, priceMin, priceMax } = req.query;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  // 🧠 filter عام لكل المنتجات
  let filter = {};

  // 💰 PRICE FILTER
if (priceMin || priceMax) {
  filter.price = {};

  if (priceMin) {
    filter.price.$gte = Number(priceMin);
  }

  if (priceMax) {
    filter.price.$lte = Number(priceMax);
  }
}

  if (category) {
    filter.category = category;
  }

  // 🔍 search (اسم أو وصف)
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // 🔃 sorting
  let sortOption = {};

  switch (sort) {
    case "newest":
      sortOption = { createdAt: -1 };
      break;

    case "price_asc":
      sortOption = { price: 1 };
      break;

    case "price_desc":
      sortOption = { price: -1 };
      break;

    case "best_selling":
      sortOption = { sold: -1 };
      break;

    case "most_viewed":
      sortOption = { views: -1 };
      break;

    default:
      sortOption = { createdAt: -1 };
  }

  const products = await Product.find(filter)
    .sort(sortOption)
    .skip(skip)
    .limit(limit)
    .populate("shop", "name");

  const total = await Product.countDocuments(filter);
  //22222
    const productsWithFavorite = await attachFavorite(userId, products);


  return successResponse(res, "All products fetched", {
    total,
    page,
    pages: Math.ceil(total / limit),
    results: products.length,
    products: productsWithFavorite,
  });
});