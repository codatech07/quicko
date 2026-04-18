const Address = require("../models/addressModel");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const { successResponse, successDeleteResponse } = require("../utils/response");

const {
  phoneRegex,
  normalizePhone,
} = require("../utils/validators/authValidators");

// CREATE ADDRESS
exports.createAddress = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  let { fullName, phone, city, street, details } = req.body;

  if (!fullName || !phone || !city || !street) {
    throw new AppError("All fields required", 400);
  }
  // check if already exists
  const existingAddress = await Address.findOne({ user: userId });
  if (existingAddress) {
    throw new AppError("Address already exists, use update", 400);
  }
  // phone validation
  phone = phone.trim();
  if (!phoneRegex.test(phone)) {
    throw new AppError("Invalid phone format", 400);
  }
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    throw new AppError("Invalid phone format", 400);
  }
  const address = await Address.create({
    user: userId,
    fullName,
    phone: normalizedPhone,
    city,
    street,
    details,
  });
  return successResponse(res, "Address created", address, 201);
});

// UPDATE ADDRESS
exports.updateAddress = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  let { fullName, phone, city, street, details } = req.body;
  const address = await Address.findOne({ user: userId });
  if (!address) {
    throw new AppError("Address not found", 404);
  }
  // update fields if exist
  if (fullName) address.fullName = fullName.trim();
  if (city) address.city = city.trim();
  if (street) address.street = street.trim();
  if (details) address.details = details.trim();
  if (phone) {
    phone = phone.trim();
    if (!phoneRegex.test(phone)) {
      throw new AppError("Invalid phone format", 400);
    }
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      throw new AppError("Invalid phone format", 400);
    }
    address.phone = normalizedPhone;
  }
  await address.save();
  return successResponse(res, "Address updated", address);
});

//  GET ADDRESS
exports.getMyAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ user: req.user.id });
  if (!address) {
    return successResponse(res, "No address found");
  }
  return successResponse(res, "Address fetched", address);
});

// get address by user ıd 
exports.getAddressByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const address = await Address.findOne({ user: userId });
  if (!address) {
    throw new AppError("Address not found", 404);
  }
  return successResponse(res, "Address fetched", address);
});

// DELETE ADDRESS
exports.deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ user: req.user.id });
  if (!address) {
    throw new AppError("Address not found", 404);
  }
  await address.deleteOne();
  return successDeleteResponse(res);
});
