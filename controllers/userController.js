const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const { successResponse } = require("../utils/response");
const AppError = require("../utils/AppError");

// GET MY PROFILE
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  return successResponse(res, "Data retrieved successfully", user);
});

// UPDATE PROFILE (name + username + phone)
exports.updateMe = asyncHandler(async (req, res) => {
  const { name, username, phone } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  if (username) {
    const normalizedUsername = username.trim().toLowerCase();
    if (normalizedUsername !== user.username) {
      const exists = await User.findOne({ username: normalizedUsername });
      if (exists) {
        throw new AppError("Username already in use", 400);
      }
      user.username = normalizedUsername;
    }
  }
  if (name) user.name = name;
  if (phone && phone !== user.phone) {
    const phoneRegex = /^[0-9]{8,15}$/;
    if (!phoneRegex.test(phone)) {
      throw new AppError("Invalid phone number", 400);
    }
    const exists = await User.findOne({ phone });
    if (exists) {
      throw new AppError("Phone number already in use", 400);
    }
    user.phone = phone;
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
