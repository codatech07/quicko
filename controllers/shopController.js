const Shop = require("../models/shopModel");
const asyncHandler = require("express-async-handler");
const { successResponse, successDeleteResponse } = require("../utils/response");
const AppError = require("../utils/AppError");
const {
  phoneRegex,
  normalizePhone,
} = require("../utils/validators/authValidators");

// create shop only admin
exports.createShop = asyncHandler(async (req, res) => {
  let { name, description, images, phone, address, category } = req.body;
  // admin check
  if (req.user.role !== "admin") {
    throw new AppError("Not authorized, admin only", 403);
  }
  // 1. required check
  if (!name || !phone || !address || !category || !description) {
    throw new AppError("All fields required", 400);
  }
  // 2. trim
  name = name.trim();
  phone = phone.trim();
  address = address.trim();
  description = description.trim();
  category = category.trim();
  // category data
  const allowedCategories = [
    "food",
    "electronics",
    "clothes",
    "pharmacy",
    "mini market",
    "other",
  ];
  if (!allowedCategories.includes(category)) {
    throw new AppError("Invalid category", 400);
  }
  // 3. images normalize
  const imagesArray = images ? (Array.isArray(images) ? images : [images]) : [];
  // 4. phone validation
  if (!phoneRegex.test(phone)) {
    throw new AppError("Invalid phone format", 400);
  }
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    throw new AppError("Invalid phone format", 400);
  }
  // 5. create shop
  const shop = await Shop.create({
    name,
    description,
    images: imagesArray,
    phone: normalizedPhone,
    address,
    category,
    owner: req.user.id,
  });
  return successResponse(res, "Shop created successfully", shop, 201);
});

// get all the shops
exports.getShops = asyncHandler(async (req, res) => {
  const shops = await Shop.find().populate("owner", "name username");
  const count = shops.length;
  return successResponse(
    res,
    `Shops fetched successfully, you have ${count} shop in DB`,
    shops,
  );
});

// get shop by ID
exports.getShopById = asyncHandler(async (req, res) => {
  // increase views 
  await Shop.findByIdAndUpdate(req.params.id, {
    $inc: { views: 1 },
  });
  // fetch shop بعد التحديث
  const shop = await Shop.findById(req.params.id).populate(
    "owner",
    "name username",
  );
  if (!shop) {
    throw new AppError("The shop is not there", 404);
  }
  return successResponse(res, "Shop fetched successfully", shop);
});

// update shop information
exports.updateShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id);
  if (!shop) {
    throw new AppError("The shop is not there", 404);
  }
  //  admin only
  if (req.user.role !== "admin") {
    throw new AppError("Not authorized, admin only", 403);
  }
  let { name, description, images, phone, address, category } = req.body;
  // 🧠 NAME
  if (name) {
    name = name.trim();
    shop.name = name;
  }
  // 🧠 DESCRIPTION
  if (description) {
    description = description.trim();
    shop.description = description;
  }
  // 🧠 CATEGORY
  if (category) {
    category = category.trim();

    const allowedCategories = [
      "food",
      "electronics",
      "clothes",
      "pharmacy",
      "mini market",
      "other",
    ];

    if (!allowedCategories.includes(category)) {
      throw new AppError("Invalid category", 400);
    }

    shop.category = category;
  }
  //  ADDRESS
  if (address) {
    address = address.trim();
    shop.address = address;
  }
  //  PHONE (نفس منطق createShop)
  if (phone) {
    phone = phone.trim();
    if (!phoneRegex.test(phone)) {
      throw new AppError("Invalid phone format", 400);
    }
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      throw new AppError("Invalid phone format", 400);
    }
    shop.phone = normalizedPhone;
  }
  // IMAGES (نفس فكرة normalize)
  if (images !== undefined) {
    const imagesArray = Array.isArray(images) ? images : [images];
    shop.images = imagesArray;
  }
  await shop.save();
  return successResponse(res, "Shop updated successfully", shop);
});

// Delete shop
exports.deleteShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id);
  if (!shop) {
    throw new AppError("The shop is not there", 404);
  }
  //  only admin
  if (req.user.role !== "admin") {
    throw new AppError("Not authorized, admin only", 403);
  }
  await shop.deleteOne();
  return successDeleteResponse(res);
});
