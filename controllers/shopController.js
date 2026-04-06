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
  res
    .status(201)
    .json({ message: "The shop has been successfully established", shop });
});
// Bring all the shops
exports.getShops = asyncHandler(async (req, res) => {
  const shops = await Shop.find().populate("owner", "name username");
  res.status(200).json({ message: "The shops were brought in", shops });
});
// One shop brought
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
  res.status(200).json({ message: "The shop was brought in", shop });
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
  res
    .status(200)
    .json({ message: "The store has been successfully updated", shop });
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
  res.status(200).json({ message: "The shop has been deleted" });
});
