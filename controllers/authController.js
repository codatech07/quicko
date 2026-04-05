const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

// Create a token
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
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

  //  Check the fields
  if (!name || !username || !email || !phone || !password || !confirmPassword) {
    const err = new Error("All fields are required");
    err.statusCode = 400;
    throw err;
  }

  //  username
  if (username.length < 3) {
    const err = new Error("The username must be at least 3 characters long");
    err.statusCode = 400;
    throw err;
  }

  // email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    const err = new Error("The email address is invalid");
    err.statusCode = 400;
    throw err;
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
    const err = new Error("Username already in use");
    err.statusCode = 400;
    throw err;
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

  await sendEmail({
    email: user.email,
    subject: "Verify your email",
    message: `Your verification code is: ${otp}`,
  });

  res.status(201).json({
    status: "success",
    message: "User registered. Please verify your email",
  });
});

//  Login
exports.login = asyncHandler(async (req, res) => {
  let { identifier, password } = req.body;

  //  Data cleaning
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
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
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
    const err = new Error("Incorrect password");
    err.statusCode = 400;
    throw err;
  }

  const token = createToken(user._id);

  res.status(200).json({
    message: "Login successful",
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
    const err = new Error("Email is required");
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findOne({ email });

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const now = Date.now();

  // reset evry day
  if (user.otpLastAttempt && now - user.otpLastAttempt > 24 * 60 * 60 * 1000) {
    user.otpAttempts = 0;
  }

  // If the limit is reached
  if (user.otpAttempts >= 5) {
    const err = new Error("You reached max OTP requests today");
    err.statusCode = 429;
    throw err;
  }

  //  Attempts 4 and 5 require waiting.
  if (user.otpAttempts >= 3) {
    if (user.otpLastAttempt && now - user.otpLastAttempt < 30 * 60 * 1000) {
      const err = new Error("Wait 30 minutes before requesting again");
      err.statusCode = 429;
      throw err;
    }
  }

  //  create OTP
  const otp = user.createPasswordResetOTP();

  // Update attempts for OTP
  user.otpAttempts += 1;
  user.otpLastAttempt = now;

  await user.save({ validateBeforeSave: false });

  const message = `Your password reset code is: ${otp}
This code will expire in 10 minutes.`;

  await sendEmail({
    email: user.email,
    subject: "Password Reset Code",
    message,
  });

  res.status(200).json({
    status: "success",
    message: "OTP sent to email",
  });
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
    const err = new Error("Invalid or expired OTP");
    err.statusCode = 400;
    throw err;
  }

  res.status(200).json({
    status: "success",
    message: "OTP verified successfully",
  });
});

// reset password
exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, password, confirmPassword } = req.body;

  if (!email || !otp || !password || !confirmPassword) {
    const err = new Error("All fields are required");
    err.statusCode = 400;
    throw err;
  }

  if (password.includes(" ")) {
    const err = new Error("Password cannot contain spaces");
    err.statusCode = 400;
    throw err;
  }

  if (password.length < 6) {
    const err = new Error("Password too short");
    err.statusCode = 400;
    throw err;
  }

  if (password !== confirmPassword) {
    const err = new Error("Passwords do not match");
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
    const err = new Error("OTP invalid or expired");
    err.statusCode = 400;
    throw err;
  }

  user.password = await bcrypt.hash(password, 12);
  user.resetPasswordOTP = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.status(200).json({
    status: "success",
    message: "Password reset successful",
  });
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

  // 2️⃣ تشفير OTP للمقارنة
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

  // 3️⃣ البحث عن المستخدم
  const user = await User.findOne({
    email: email.toLowerCase(),
    emailVerificationOTP: hashedOTP,
    emailVerificationExpire: { $gt: Date.now() },
  });

  // 4️⃣ إذا الكود غلط أو منتهي
  if (!user) {
    const err = new Error("Invalid or expired OTP");
    err.statusCode = 400;
    throw err;
  }

  // 5️⃣ تفعيل الحساب
  user.isVerified = true;
  user.emailVerificationOTP = undefined;
  user.emailVerificationExpire = undefined;
  const token = createToken(user._id);

  await user.save();

  // 6️⃣ الرد
  res.status(200).json({
    status: "success",
    message: "Email verified successfully",
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
  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
});
