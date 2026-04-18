const Product = require("../models/productModel"); 
const Shop = require("../models/shopModel"); 
const asyncHandler = require("express-async-handler"); 
const AppError = require("../utils/AppError"); 
const { successResponse,successDeleteResponse } = require("../utils/response");
const attachFavorite = require("../utils/attachFavorite"); 
const User = require("../models/userModel"); 
const cloudinary = require("../config/cloudinary"); 


// CREATE PRODUCT
exports.createProduct = asyncHandler(async (req, res) => {
  // [INPUT]
  let { name, description, category, price, oldPrice, stock, images, currency, unit } = req.body;
  // [INPUT] Shop ID from params
  const shopId = req.params.shopId;
  // [VALIDATION] Required fields
  if (
    !name ||
    !description ||
    !category ||
    price == null ||
    stock == null ||
    !currency ||
    !unit ||
    !req.files ||
    req.files.length === 0
  ) {
    throw new AppError("All required fields must be provided", 400);
  }
  // [SANITIZE] Trim text fields
  name = name.trim();
  description = description.trim();
  category = category.trim();
  // [FILE_PROCESS] Normalize uploaded images
  const imagesArray = req.files.map((file) => ({
    url: file.path,
    public_id: file.filename,
  }));
  // [DB_FETCH] Check if shop exists
  const shopExists = await Shop.findById(shopId);
  if (!shopExists) {
    throw new AppError("Shop not found", 404);
  }
  // [DB_WRITE] Create product
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
    unit,
  });
  // [RESPONSE]
  return successResponse(res, "Product created successfully", product, 201);
});


// GET SHOP PRODUCTS
exports.getShopProducts = asyncHandler(async (req, res) => {
  // [INPUT]
  const { shopId } = req.params;
  let { page, limit, sort, category } = req.query;
  // [PAGINATION]
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 14;
  const skip = (page - 1) * limit;
  // [DB_FETCH] Check shop exists
  const shopExists = await Shop.findById(shopId);
  if (!shopExists) {
    throw new AppError("Shop not found", 404);
  }
  // [FILTER]
  let filter = { shop: shopId };
  if (category) filter.category = category;
  // [SORT]
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
  // [DB_FETCH] Get products
  const products = await Product.find(filter)
    .sort(sortOption)
    .skip(skip)
    .limit(limit);
  // [DB_COUNT]
  const total = await Product.countDocuments(filter);
  // [AUTH]
  const userId = req.user?.id || null;
  // [BUSINESS_LOGIC] Attach favorite flag
  const productsWithFavorite = await attachFavorite(userId, products);
  // [RESPONSE]
  return successResponse(res, "Products fetched successfully", {
    total,
    page,
    pages: Math.ceil(total / limit),
    results: products.length,
    products: productsWithFavorite,
  });
});


// GET PRODUCT BY ID
exports.getProductById = asyncHandler(async (req, res) => {
  // [INPUT]
  const { productId } = req.params;
  // [AUTH]
  const userId = req.user?.id || null;
  // [DB_FETCH]
  let product = await Product.findById(productId).populate("shop");
  // [ERROR]
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  // [BUSINESS_LOGIC] Increment views
  product.views += 1;
  // [DB_WRITE]
  await product.save();
  // [BUSINESS_LOGIC]
  const productWithFavorite = await attachFavorite(userId, product);
  // [RESPONSE]
  return successResponse(res, "Product fetched successfully", productWithFavorite);
});

// UPDATE PRODUCT
exports.updateProduct = asyncHandler(async (req, res) => {
  // [INPUT]
  const { productId } = req.params;
  // [DB_FETCH]
  const product = await Product.findById(productId);
  // [ERROR]
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  // [INPUT]
  let {
    name,
    description,
    category,
    price,
    oldPrice,
    stock,
    images,
    currency,
    unit
  } = req.body;
  // [UPDATE] Fields
  if (name) product.name = name.trim();
  if (description) product.description = description.trim();
  if (category) product.category = category.trim();
  if (price != null) product.price = price;
  if (oldPrice != null) product.oldPrice = oldPrice;
  if (stock != null) product.stock = stock;
  if (currency) product.currency = currency;
  if (unit) product.unit = unit;
  // [FILE_UPDATE] Replace images
  if (req.files && req.files.length > 0) {
    // [CLOUDINARY_DELETE] Remove old images
    for (const img of product.images) {
      await cloudinary.uploader.destroy(img.public_id);
    }
    // [FILE_PROCESS] Add new images
    const imagesArray = req.files.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }));
    // [UPDATE]
    product.images = imagesArray;
  }
  // [DB_WRITE]
  await product.save();
  // [RESPONSE]
  return successResponse(res, "Product updated successfully", product);
});

// DELETE PRODUCT
exports.deleteProduct = asyncHandler(async (req, res) => {
  // [INPUT]
  const { productId } = req.params;
  // [DB_FETCH]
  const product = await Product.findById(productId);
  // [ERROR]
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  // [CLEANUP] Remove product from all users favorites
  await User.updateMany(
    { favorites: productId },
    { $pull: { favorites: productId } }
  );
  // [CLOUDINARY_DELETE] Remove images
  for (const img of product.images) {
    await cloudinary.uploader.destroy(img.public_id);
  }
  // [DB_DELETE]
  await product.deleteOne();
  // [RESPONSE]
  return successDeleteResponse(res,);
});


// GET ALL PRODUCTS
exports.getAllProducts = asyncHandler(async (req, res) => {
  // [AUTH]
  const userId = req.user?.id;
  // [INPUT]
  let { page, limit, sort, category, search, priceMin, priceMax } = req.query;
  // [PAGINATION]
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;
  // [FILTER]
  let filter = {};
  // [FILTER] Price range
  if (priceMin || priceMax) {
    filter.price = {};
    if (priceMin) filter.price.$gte = Number(priceMin);
    if (priceMax) filter.price.$lte = Number(priceMax);
  }
  // [FILTER] Category
  if (category) {
    filter.category = category;
  }
  // [FILTER] Search (name + description)
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }
  // [SORT]
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
  // [DB_FETCH]
  const products = await Product.find(filter)
    .sort(sortOption)
    .skip(skip)
    .limit(limit)
    .populate("shop", "name");
  // [DB_COUNT]
  const total = await Product.countDocuments(filter);
  // [BUSINESS_LOGIC]
  const productsWithFavorite = await attachFavorite(userId, products);
  // [RESPONSE]
  return successResponse(res, "All products fetched", {
    total,
    page,
    pages: Math.ceil(total / limit),
    results: products.length,
    products: productsWithFavorite,
  });
});