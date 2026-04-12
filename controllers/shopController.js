const Shop = require("../models/shopModel");
const asyncHandler = require("express-async-handler");
const { successResponse, successDeleteResponse } = require("../utils/response");
const AppError = require("../utils/AppError");

// create shop
exports.createShop = asyncHandler(async (req, res) => {
  const { name, description, images, phone, address } = req.body;
  if (!name || !phone || !address) {
    throw new AppError("Name and Phone and Address Required", 400);
  }
  const shop = await Shop.create({
    name,
    description,
    images,
    phone,
    address,
    owner: req.user.id,
  });
  return successResponse(res, "Shop created successfully", shop, 201);
});

// get all the shops
exports.getShops = asyncHandler(async (req, res) => {
  const shops = await Shop.find().populate("owner", "name username");
  return successResponse(res, "Shops fetched successfully", shops);
});

// get shop by ID
exports.getShopById = asyncHandler(async (req, res) => {
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
  // 🔒 فقط admin
  if (req.user.role !== "admin") {
    throw new AppError("Not authorized, admin only", 403);
  }


  const { name, description, images, phone, address } = req.body;

   // ✅ normalize images (إذا موجودة فقط)
  if (images !== undefined) {
    if (!Array.isArray(images)) {
      shop.images = [images]; // صورة وحدة
    } else {
      shop.images = images; // array
    }
  }

  shop.name = name || shop.name;
  shop.description = description || shop.description;
  shop.phone = phone || shop.phone;
  shop.address = address || shop.address;

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
