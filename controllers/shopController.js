const Shop = require("../models/shopModel");
const asyncHandler = require("express-async-handler"); 
const { successResponse, successDeleteResponse } = require("../utils/response"); 
const AppError = require("../utils/AppError");
const { SHOPCATEGORIES } = require("../utils/validators/constantsShopProduct"); 
const cloudinary = require("../config/cloudinary"); 

const {
  phoneRegex,
  normalizePhone,
} = require("../utils/validators/authValidators"); // [VALIDATORS]

// CREATE SHOP (ADMIN ONLY)
exports.createShop = asyncHandler(async (req, res) => {
  // [INPUT]
  let { name, description, phone, address, category } = req.body;
  // [AUTH] Admin check
  if (req.user.role !== "admin") {
    throw new AppError("Not authorized, admin only", 403);
  }
  // [VALIDATION] Required fields
  if (!name || !phone || !address || !category || !description) {
    throw new AppError("All fields required", 400);
  }
  // [SANITIZE]
  name = name.trim();
  phone = phone.trim();
  address = address.trim();
  description = description.trim();
  category = category.trim();
  // [VALIDATION] Category check
  if (category && !SHOPCATEGORIES.includes(category)) {
    throw new AppError("Invalid category", 400);
  }
  // [FILE_PROCESS] Normalize uploaded images
  const imagesArray = req.files
    ? req.files.map((file) => ({
        url: file.path,
        public_id: file.filename,
      }))
    : [];
  // [VALIDATION] Phone format
  if (!phoneRegex.test(phone)) {
    throw new AppError("Invalid phone format", 400);
  }
  // [PROCESS] Normalize phone
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    throw new AppError("Invalid phone format", 400);
  }
  // [DB_WRITE] Create shop
  const shop = await Shop.create({
    name,
    description,
    images: imagesArray,
    phone: normalizedPhone,
    address,
    category,
    owner: req.user.id,
  });
  // [RESPONSE]
  return successResponse(res, "Shop created successfully", shop, 201);
});


// GET ALL SHOPS
exports.getShops = asyncHandler(async (req, res) => {
  // [DB_FETCH]
  const shops = await Shop.find().populate("owner", "name username");
  // [CALCULATION]
  const count = shops.length;
  // [RESPONSE]
  return successResponse(
    res,
    `Shops fetched successfully, you have ${count} shop in DB`,
    shops,
  );
});

// GET SHOP BY ID
exports.getShopById = asyncHandler(async (req, res) => {
  // [DB_UPDATE] Increment views
  await Shop.findByIdAndUpdate(req.params.id, {
    $inc: { views: 1 },
  });
  // [DB_FETCH]
  const shop = await Shop.findById(req.params.id).populate(
    "owner",
    "name username",
  );
  // [ERROR]
  if (!shop) {
    throw new AppError("The shop is not there", 404);
  }
  // [RESPONSE]
  return successResponse(res, "Shop fetched successfully", shop);
});


// UPDATE SHOP
exports.updateShop = asyncHandler(async (req, res) => {
  // [DB_FETCH]
  const shop = await Shop.findById(req.params.id);
  // [ERROR]
  if (!shop) {
    throw new AppError("The shop is not there", 404);
  }
  // [AUTH] Admin only
  if (req.user.role !== "admin") {
    throw new AppError("Not authorized, admin only", 403);
  }
  // [INPUT]
  let { name, description, phone, address, category } = req.body;
  // [UPDATE] Name
  if (name) {
    name = name.trim();
    shop.name = name;
  }
  // [UPDATE] Description
  if (description) {
    description = description.trim();
    shop.description = description;
  }
  // [UPDATE + VALIDATION] Category
  if (category) {
    category = category.trim();
    if (category && !SHOPCATEGORIES.includes(category)) {
      throw new AppError("Invalid category", 400);
    }
    shop.category = category;
  }
  // [UPDATE] Address
  if (address) {
    address = address.trim();
    shop.address = address;
  }
  // [VALIDATION + UPDATE] Phone
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

  // [FILE_UPDATE] Replace images
  if (req.files && req.files.length > 0) {
    // [CLOUDINARY_DELETE] Remove old images
    for (const img of shop.images) {
      await cloudinary.uploader.destroy(img.public_id);
    }
    // [FILE_PROCESS] Add new images
    const imagesArray = req.files.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }));
    // [UPDATE]
    shop.images = imagesArray;
  }
  // [DEBUG_LOG]
  console.log("FILES:", req.files.length);
  console.log("UPLOAD HIT");
  // [DB_WRITE]
  await shop.save();
  // [RESPONSE]
  return successResponse(res, "Shop updated successfully", shop);
});


// DELETE SHOP
exports.deleteShop = asyncHandler(async (req, res) => {
  // [DB_FETCH]
  const shop = await Shop.findById(req.params.id);
  // [ERROR]
  if (!shop) {
    throw new AppError("The shop is not there", 404);
  }
  // [AUTH] Admin only
  if (req.user.role !== "admin") {
    throw new AppError("Not authorized, admin only", 403);
  }
  // [CONFIG] Cloudinary instance
  const cloudinary = require("../config/cloudinary");
  // [CLOUDINARY_DELETE] Remove all images
  for (const img of shop.images) {
    await cloudinary.uploader.destroy(img.public_id);
  }
  // [DB_DELETE]
  await shop.deleteOne();
  // [RESPONSE]
  return successDeleteResponse(res);
});