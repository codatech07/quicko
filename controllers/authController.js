const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const AppError = require("../utils/AppError");
// Create a token
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Register
exports.register = asyncHandler(async (req, res) => {
  let { name, username, email, phone, password, confirmPassword } = req.body;
  // Data cleaning
  name = name.trim();
  username = username.trim().toLowerCase();
  email = email.trim().toLowerCase();
  phone = phone.trim();
  if (password.includes(" ")) {
    const err = new Error("The password cannot contain spaces");
    err.statusCode = 400;
    throw err;
  }
  // Check the fields
  if (!name || !username || !email || !phone || !password || !confirmPassword) {
    throw new AppError("All fields are required", 400);
  }
  // username
  if (username.length < 3) {
    const err = new Error("The username must be at least 3 characters long");
    err.statusCode = 400;
    throw err;
  }
  // email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError("The email address is invalid", 400);
  }
  // phone
  const phoneRegex = /^[0-9]{8,15}$/;
  if (!phoneRegex.test(phone)) {
    const err = new Error("Invalid phone number");
    err.statusCode = 400;
    throw err;
  }
  // password (Medium strength)
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=\S+$).{6,}$/;
  if (!passwordRegex.test(password)) {
    const err = new Error(
      "The password must contain letters and numbers and no spaces",
    );
    err.statusCode = 400;
    throw err;
  }
  // Password match
  if (password !== confirmPassword) {
    const err = new Error("The passwords do not match");
    err.statusCode = 400;
    throw err;
  }
  // username match
  const usernameExists = await User.findOne({ username });
  if (usernameExists) {
    throw new AppError("Username already in use", 400);
  }
  // email match
  const emailExists = await User.findOne({ email });
  if (emailExists) {
    const err = new Error("The email address is already in use");
    err.statusCode = 400;
    throw err;
  }
  // phone match
  const phoneExists = await User.findOne({ phone });
  if (phoneExists) {
    const err = new Error("Phone number already in use");
    err.statusCode = 400;
    throw err;
  }
  // password encryption
  const hashedPassword = await bcrypt.hash(password, 12);
  const user = new User({
    name,
    username,
    email,
    phone,
    password: hashedPassword,
  });
  const otp = user.createEmailVerificationOTP();
  await user.save();
  //try
  try {
    sendEmail({
      email: user.email,
      subject: "Verify your email",
      message: `Your verification code is: ${otp}`,
    });
  } catch (err) {
    console.log("Email failed but user created");
  }
  // 00000
  return successResponse(
    res,
    "User registered. Please verify your email",
    null,
    201,
  );
});

// Login
exports.login = asyncHandler(async (req, res) => {
  let { identifier, password } = req.body;
  // Data cleaning
  identifier = identifier.trim();
  password = password.trim();
  if (!identifier || !password) {
    const err = new Error("Please enter your email or username and password");
    err.statusCode = 400;
    throw err;
  }
  // Specify whether it is email or username
  const isEmail = identifier.includes("@");
  const query = isEmail
    ? { email: identifier.toLowerCase() }
    : { username: identifier.toLowerCase() };
  const user = await User.findOne(query).select("+password");
  if (!user) {
    throw new AppError("User not found", 404);
  }
  // is email validate
  if (!user.isVerified) {
    // 🔐 إنشاء OTP جديد
    const otp = user.createEmailVerificationOTP();
    await user.save({ validateBeforeSave: false });
    // 📧 إرسال الإيميل
    await sendEmail({
      email: user.email,
      subject: "Verify your email",
      message: `Your verification code is: ${otp}`,
    });
    return res.status(403).json({
      email: user.email,
      status: "error",
      message: "Account not verified. A new OTP has been sent to your email",
    });
  }
  // Password verification
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError("Incorrect password", 400);
  }
  const token = createToken(user._id);
  return successResponse(res, "Login successful", {
    token,
    user: {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
});

// FORGOT PASSWORD
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new AppError("Email is required", 400);
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("User not found", 404);
  }
  const now = Date.now();
  // reset evry day
  if (user.otpLastAttempt && now - user.otpLastAttempt > 24 * 60 * 60 * 1000) {
    user.otpAttempts = 0;
  }
  // If the limit is reached
  if (user.otpAttempts >= 5) {
    throw new AppError("You reached max OTP requests today", 429);
  }
  // Attempts 4 and 5 require waiting.
  if (user.otpAttempts >= 3) {
    if (user.otpLastAttempt && now - user.otpLastAttempt < 30 * 60 * 1000) {
      throw new AppError("Wait 30 minutes before requesting again", 429);
    }
  }
  // create OTP
  const otp = user.createPasswordResetOTP();
  // Update attempts for OTP
  user.otpAttempts += 1;
  user.otpLastAttempt = now;
  await user.save({ validateBeforeSave: false });
  const message = `Your password reset code is: ${otp} This code will expire in 10 minutes.`;
  await sendEmail({
    email: user.email,
    subject: "Password Reset Code",
    message,
  });
  return successResponse(res, "OTP sent to email");
});

// verify otp
exports.verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    const err = new Error("Email and OTP are required");
    err.statusCode = 400;
    throw err;
  }
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
  const user = await User.findOne({
    email,
    resetPasswordOTP: hashedOTP,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    throw new AppError("Invalid or expired OTP", 400);
  }
  user.resetPasswordOTP = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  return successResponse(res, "OTP verified successfully");
});

// reset password
exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, password, confirmPassword } = req.body;
  if (!email || !otp || !password || !confirmPassword) {
    throw new AppError("All fields are required", 400);
  }
  if (password.includes(" ")) {
    const err = new Error("Password cannot contain spaces");
    err.statusCode = 400;
    throw err;
  }
  if (password.length < 6) {
    throw new AppError("Password too short", 400);
  }
  if (password !== confirmPassword) {
    throw new AppError("Passwords do not match", 400);
  }
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
  const user = await User.findOne({
    email,
    resetPasswordOTP: hashedOTP,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    throw new AppError("OTP invalid or expired", 400);
  }
  user.password = await bcrypt.hash(password, 12);
  user.resetPasswordOTP = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  return successResponse(res, "Password reset successful");
});

// verify Email
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  // 1️⃣ تحقق من البيانات
  if (!email || !otp) {
    const err = new Error("Email and OTP required");
    err.statusCode = 400;
    throw err;
  }
  // // 2️⃣ تشفير OTP للمقارنة
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
  // 3️⃣ البحث عن المستخدم
  const user = await User.findOne({
    email: email.toLowerCase(),
    emailVerificationOTP: hashedOTP,
    emailVerificationExpire: { $gt: Date.now() },
  });
  // 4️⃣ إذا الكود غلط أو منتهي
  if (!user) {
    throw new AppError("Invalid or expired OTP", 400);
  }
  // 5️⃣ تفعيل الحساب
  user.isVerified = true;
  user.emailVerificationOTP = undefined;
  user.emailVerificationExpire = undefined;
  const token = createToken(user._id);
  await user.save();
  // 6️⃣ الرد
  return successResponse(res, "Email verified successfully", {
    token,
    user: {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
});

// log out
exports.logout = asyncHandler(async (req, res) => {
  return successResponse(res, "Logged out successfully");
});
