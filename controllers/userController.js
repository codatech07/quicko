const User = require("../models/userModel");
const PendingUser = require("../models/pendingUserModel");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const { successResponse } = require("../utils/response");
const AppError = require("../utils/AppError");
const {
  usernameRegex,
  emailRegex,
  phoneRegex,
  passwordRegex,
  normalizePhone,
} = require("../utils/validators/authValidators");

// GET MY PROFILE
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  return successResponse(res, "Data retrieved successfully", user);
});

// UPDATE PROFILE (name + username + phone)
exports.updateMe = asyncHandler(async (req, res) => {
  let { name, username, phone } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  // USERNAME
  if (username) {
    username = username.trim().toLowerCase();
    if (!usernameRegex.test(username)) {
      throw new AppError(
        "Username must be 5-20 chars, letters/numbers, can include _ or .",
        400,
      );
    }
    if (username !== user.username) {
      const [userUsername, pendingUsername] = await Promise.all([
        User.findOne({ username, _id: { $ne: user._id } }),
        PendingUser.findOne({ username }),
      ]);
      if (userUsername || pendingUsername) {
        throw new AppError("Username already in use", 400);
      }
      user.username = username;
    }
  }
  // NAME
  if (name) {
    user.name = name.trim();
  }
  // PHONE
  if (phone) {
    phone = phone.trim();

    if (!phoneRegex.test(phone)) {
      throw new AppError("Invalid phone number format", 400);
    }
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      throw new AppError("Invalid phone number format", 400);
    }
    if (normalizedPhone !== user.phone) {
      const [userPhone, pendingPhone] = await Promise.all([
        User.findOne({ phone: normalizedPhone, _id: { $ne: user._id } }),
        PendingUser.findOne({ phone: normalizedPhone }),
      ]);

      if (userPhone || pendingPhone) {
        throw new AppError("Phone number already in use", 400);
      }
      user.phone = normalizedPhone;
    }
  }
  await user.save();

  return successResponse(res, "Data updated successfully", user);
});

// CHANGE PASSWORD
exports.changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (newPassword.includes(" ")) {
    throw new AppError("The password cannot contain spaces", 400);
  }
  const user = await User.findById(req.user.id).select("+password");
  if (!user) {
    throw new AppError("User not found", 404);
  }
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    throw new AppError("The old password is incorrect", 400);
  }
  if (newPassword !== confirmPassword) {
    throw new AppError("The passwords do not match", 400);
  }
  if (newPassword.length < 6) {
    throw new AppError("The password is too short", 400);
  }
  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
  return successResponse(res, "Password changed successfully");
});

// GET USER BY ID (Admin only)
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return successResponse(res, "User retrieved successfully", user);
});

// GET ALL USERS (Admin only)
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  return successResponse(res, "Users retrieved successfully", {
    count: users.length,
    users,
  });
});

// DELETE USER (Admin only)
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  await user.deleteOne();
  return successResponse(res, "User deleted successfully");
});
