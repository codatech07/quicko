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
  // [AUTH] Get logged-in user ID
  const userId = req.user.id;
  // [INPUT] Extract data from request body
  let { fullName, phone, city, street, details } = req.body;
  // [VALIDATION] Required fields check
  if (!fullName || !phone || !city || !street) {
    throw new AppError("All fields required", 400);
  }
  // [DB CHECK] Ensure user doesn't already have an address
  const existingAddress = await Address.findOne({ user: userId });
  if (existingAddress) {
    throw new AppError("Address already exists, use update", 400);
  }
  // [VALIDATION] Phone format check
  phone = phone.trim();
  if (!phoneRegex.test(phone)) {
    throw new AppError("Invalid phone format", 400);
  }
  // [PROCESS] Normalize phone number
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    throw new AppError("Invalid phone format", 400);
  }
  // [DB CREATE] Save new address
  const address = await Address.create({
    user: userId,
    fullName,
    phone: normalizedPhone,
    city,
    street,
    details,
  });
  // [RESPONSE] Success response
  return successResponse(res, "Address created", address, 201);
});

// UPDATE ADDRESS
exports.updateAddress = asyncHandler(async (req, res) => {
  // [AUTH] Get user ID
  const userId = req.user.id;
  // [INPUT] Extract fields
  let { fullName, phone, city, street, details } = req.body;
  // [DB FETCH] Get user's address
  const address = await Address.findOne({ user: userId });
  if (!address) {
    throw new AppError("Address not found", 404);
  }
  // [UPDATE] Update fields only if provided
  if (fullName) address.fullName = fullName.trim();
  if (city) address.city = city.trim();
  if (street) address.street = street.trim();
  if (details) address.details = details.trim();
  // [VALIDATION + UPDATE] Phone update
  if (phone) {
    phone = phone.trim();
    // [VALIDATION] Check format
    if (!phoneRegex.test(phone)) {
      throw new AppError("Invalid phone format", 400);
    }
    // [PROCESS] Normalize phone
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      throw new AppError("Invalid phone format", 400);
    }
    // [UPDATE] Assign new phone
    address.phone = normalizedPhone;
  }
  // [DB SAVE] Persist changes
  await address.save();
  // [RESPONSE]
  return successResponse(res, "Address updated", address);
});


// GET MY ADDRESS
exports.getMyAddress = asyncHandler(async (req, res) => {
  // [AUTH] Get user ID
  const userId = req.user.id;
  // [DB FETCH] Find address
  const address = await Address.findOne({ user: userId });
  // [RESPONSE] If not found
  if (!address) {
    return successResponse(res, "No address found");
  }
  // [RESPONSE] Success
  return successResponse(res, "Address fetched", address);
});

// GET ADDRESS BY USER ID
exports.getAddressByUserId = asyncHandler(async (req, res) => {
  // [INPUT] Get userId from params
  const { userId } = req.params;
  // [DB FETCH]
  const address = await Address.findOne({ user: userId });
  // [ERROR] Not found
  if (!address) {
    throw new AppError("Address not found", 404);
  }
  // [RESPONSE]
  return successResponse(res, "Address fetched", address);
});

// DELETE ADDRESS
exports.deleteAddress = asyncHandler(async (req, res) => {
  // [AUTH] Get user ID
  const userId = req.user.id;
  // [DB FETCH]
  const address = await Address.findOne({ user: userId });
  // [ERROR] If not found
  if (!address) {
    throw new AppError("Address not found", 404);
  }
  // [DB DELETE]
  await address.deleteOne();
  // [RESPONSE]
  return successDeleteResponse(res);
});