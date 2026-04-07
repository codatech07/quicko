const Shop = require("../models/shopModel");
const asyncHandler = require("express-async-handler");

// create shop
exports.createShop = asyncHandler(async (req, res) => {
  const { name, description, image, phone, address } = req.body;
  if (!name || !phone || !address) {
    const err = new Error("Name and Phone and Address Required");
    err.statusCode = 400;
    throw err;
  }
  const shop = await Shop.create({
    name,
    description,
    image,
    phone,
    address,
    owner: req.user.id,
  });
  return successResponse(
  res,
  "Shop created successfully",
  shop,
  201
);
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
    const err = new Error("The shop is not there");
    err.statusCode = 404;
    throw err;
  }
  return successResponse(res, "Shop fetched successfully", shop);
});

// update shop information
exports.updateShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id);
  if (!shop) {
    const err = new Error("The shop is not there");
    err.statusCode = 404;
    throw err;
  }
  // 🔒 فقط admin
  if (req.user.role !== "admin") {
    const err = new Error("Not authorized, admin only");
    err.statusCode = 403;
    throw err;
  }
  shop.name = req.body.name || shop.name;
  shop.description = req.body.description || shop.description;
  shop.image = req.body.image || shop.image;
  shop.phone = req.body.phone || shop.phone;
  shop.address = req.body.address || shop.address;
  await shop.save();
  return successResponse(res, "Shop deleted successfully");
});

// Delete shop
exports.deleteShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id);
  if (!shop) {
    const err = new Error("The shop is not there");
    err.statusCode = 404;
    throw err;
  }
  // 🔒 فقط admin
  if (req.user.role !== "admin") {
    const err = new Error("Not authorized, admin only");
    err.statusCode = 403;
    throw err;
  }
  await shop.deleteOne();
  return successResponse(res, "Shop deleted successfully");
});
