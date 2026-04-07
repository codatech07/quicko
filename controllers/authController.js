const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const AppError = require("../utils/AppError");
const { successResponse } = require("../utils/response");

// Create JWT
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// ================= REGISTER =================
exports.register = asyncHandler(async (req, res) => {
  let { name, username, email, phone, password, confirmPassword } = req.body;

  // تنظيف البيانات
  name = name?.trim();
  username = username?.trim().toLowerCase();
  email = email?.trim().toLowerCase();
  phone = phone?.trim();

  if (!name || !email || !password || !confirmPassword) {
    throw new AppError("All fields are required", 400);
  }

  if (password.includes(" ")) {
    throw new AppError("Password cannot contain spaces", 400);
  }

  if (username.length < 3) {
    throw new AppError("Username must be at least 3 characters", 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError("Invalid email format", 400);
  }

  const phoneRegex = /^[0-9]{8,15}$/;
  if (!phoneRegex.test(phone)) {
    throw new AppError("Invalid phone number", 400);
  }

  if (password.length < 6) {
    throw new AppError("Password too short", 400);
  }

  if (password !== confirmPassword) {
    throw new AppError("Passwords do not match", 400);
  }

  // تحقق من التكرار
  const [usernameExists, emailExists, phoneExists] = await Promise.all([
    User.findOne({ username }),
    User.findOne({ email }),
    User.findOne({ phone }),
  ]);

  if (usernameExists) throw new AppError("Username already in use", 400);
  if (emailExists) throw new AppError("Email already in use", 400);
  if (phoneExists) throw new AppError("Phone already in use", 400);

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

  // إرسال الإيميل
  try {
    await sendEmail({
      email: user.email,
      subject: "Verify your email",
      message: `Your verification code is: ${otp}`,
    });
  } catch (err) {
    console.log("Email failed:", err.message);
  }

  return successResponse(
    res,
    "User registered. Please verify your email",
    null,
    201
  );
});

// ================= LOGIN =================
exports.login = asyncHandler(async (req, res) => {
  let { identifier, password } = req.body;

  identifier = identifier?.trim();
  password = password?.trim();

  if (!identifier || !password) {
    throw new AppError("Email/username and password required", 400);
  }

  const isEmail = identifier.includes("@");

  const user = await User.findOne(
    isEmail
      ? { email: identifier.toLowerCase() }
      : { username: identifier.toLowerCase() }
  ).select("+password");

  if (!user) throw new AppError("User not found", 404);

  // إذا غير مفعل
  if (!user.isVerified) {
    const otp = user.createEmailVerificationOTP();
    await user.save({ validateBeforeSave: false });

    await sendEmail({
      email: user.email,
      subject: "Verify your email",
      message: `Your verification code is: ${otp}`,
    });

    return res.status(403).json({
      message: "Account not verified. OTP sent again",
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError("Incorrect password", 400);

  const token = createToken(user._id);

  return successResponse(res, "Login successful", {
    token,
    user,
  });
});

// ================= FORGOT PASSWORD =================
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) throw new AppError("Email is required", 400);
  const user = await User.findOne({ email });
  if (!user) throw new AppError("User not found", 404);

  const now = Date.now();

  if (user.otpLastAttempt && now - user.otpLastAttempt > 86400000) {
    user.otpAttempts = 0;
  }

  if (user.otpAttempts >= 5) {
    throw new AppError("Max OTP requests reached", 429);
  }

  if (user.otpAttempts >= 3) {
    if (now - user.otpLastAttempt < 30 * 60 * 1000) {
      throw new AppError("Wait 30 minutes", 429);
    }
  }

  const otp = user.createPasswordResetOTP();

  user.otpAttempts += 1;
  user.otpLastAttempt = now;

  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user.email,
    subject: "Password Reset Code",
    message: `Your reset code is: ${otp}`,
  });

  return successResponse(res, "OTP sent to email");
});

// ================= VERIFY OTP =================
exports.verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new AppError("Email and OTP required", 400);
  }

  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

  const user = await User.findOne({
    email,
    resetPasswordOTP: hashedOTP,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) throw new AppError("Invalid or expired OTP", 400);

  user.resetPasswordOTP = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  return successResponse(res, "OTP verified");
});

// ================= RESET PASSWORD =================
exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, password, confirmPassword } = req.body;

  if (!email || !password || !confirmPassword) {
    throw new AppError("All fields required", 400);
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

  if (!user) throw new AppError("Invalid OTP", 400);

  user.password = await bcrypt.hash(password, 12);
  user.resetPasswordOTP = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  return successResponse(res, "Password reset successful");
});

// ================= VERIFY EMAIL =================
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new AppError("Email and OTP required", 400);
  }

  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

  const user = await User.findOne({
    email: email.toLowerCase(),
    emailVerificationOTP: hashedOTP,
    emailVerificationExpire: { $gt: Date.now() },
  });

  if (!user) throw new AppError("Invalid or expired OTP", 400);

  user.isVerified = true;
  user.emailVerificationOTP = undefined;
  user.emailVerificationExpire = undefined;

  await user.save();

  const token = createToken(user._id);

  return successResponse(res, "Email verified", {
    token,
    user,
  });
});

// ================= LOGOUT =================
exports.logout = asyncHandler(async (req, res) => {
  return successResponse(res, "Logged out");
});