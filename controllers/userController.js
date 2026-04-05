const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");

//  GET MY PROFILE
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  res.status(200).json({
  status: "success",
  message: "Data retrieved successfully",
  user,
});
});

//  UPDATE PROFILE (name + username + phone)
exports.updateMe = asyncHandler(async (req, res) => {
  const { name, username, phone } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  if (username) {
  const normalizedUsername = username.trim().toLowerCase();

  if (normalizedUsername !== user.username) {
    const exists = await User.findOne({ username: normalizedUsername });

    if (exists) {
      const err = new Error("Username already in use");
      err.statusCode = 400;
      throw err;
    }

    user.username = normalizedUsername;
  }
}

  if (name) user.name = name;
  if (phone && phone !== user.phone) {
  const phoneRegex = /^[0-9]{8,15}$/;

  if (!phoneRegex.test(phone)) {
    const err = new Error("Invalid phone number");
    err.statusCode = 400;
    throw err;
  }

  const exists = await User.findOne({ phone });

  if (exists) {
    const err = new Error("Phone number already in use");
    err.statusCode = 400;
    throw err;
  }

  user.phone = phone;
}

  await user.save();

  res.status(200).json({
  status: "success",
  message: "Data updated successfully",
  user,
});
});

// CHANGE PASSWORD
exports.changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (newPassword.includes(" ")) {
    const err = new Error("The password cannot contain spaces");
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(req.user.id).select("+password");

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);

  if (!isMatch) {
    const err = new Error("The old password is incorrect");
    err.statusCode = 400;
    throw err;
  }

  if (newPassword !== confirmPassword) {
    const err = new Error("The passwords do not match");
    err.statusCode = 400;
    throw err;
  }

  if (newPassword.length < 6) {
    const err = new Error("The password is too short");
    err.statusCode = 400;
    throw err;
  }

  user.password = await bcrypt.hash(newPassword, 12);

  await user.save();

  res.status(200).json({
  status: "success",
  message: "Password changed successfully",
});
});

//  GET USER BY ID (Admin only)
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  res.status(200).json({
  status: "success",
  message: "User retrieved successfully",
  user,
});
});

//  GET ALL USERS (Admin only)
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");

  res.status(200).json({
    status: "success",
    message: "Users retrieved successfully",
    count: users.length,
    users,
  });
});

//  DELETE USER (Admin only)
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  await user.deleteOne();

  res.status(200).json({
  status: "success",
  message: "User deleted successfully",
});
});
