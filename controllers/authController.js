const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const AppError = require("../utils/AppError");
const {
  successResponse,
  errorResponse,
  successCreateResponse,
  errorResponseForAvailability,
  successResponseForAvailability,
  errorResponseForAvailabilityNoData,
  errorResponseForHandred,
} = require("../utils/response");

// Create a token
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
//
//  [1] REGISTER USER
exports.register = asyncHandler(async (req, res) => {
  // Extract and normalize input
  let { name, username, email, phone, password, confirmPassword } = req.body;
  // Data cleaning
  name = name.trim();
  username = username.trim().toLowerCase();
  email = email.trim().toLowerCase();
  phone = phone.trim();
  // Prevent spaces in password (security rule)
  if (password.includes(" ")) {
    throw new AppError("The password cannot contain spaces", 400);
  }
  // // Ensure all fields exist
  if (!name || !username || !email || !phone || !password || !confirmPassword) {
    throw new AppError("All fields are required", 400);
  }
  // // Username validation
  if (username.length < 3) {
    throw new AppError("The username must be at least 3 characters long", 400);
  }
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError("The email address is invalid", 400);
  }
  // phone
  const phoneRegex = /^[0-9]{8,15}$/;
  if (!phoneRegex.test(phone)) {
    throw new AppError("Invalid phone number", 400);
  }
  // password (Medium strength) Password strength validation
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=\S+$).{6,}$/;
  if (!passwordRegex.test(password)) {
    throw new AppError(
      "The password must contain letters and numbers and no spaces",
      400,
    );
  }

  // Check password match
  if (password !== confirmPassword) {
    throw new AppError("The passwords do not match", 400);
  }
  // Check username match
  const usernameExists = await User.findOne({ username });
  if (usernameExists) {
    throw new AppError("Username already in use", 400);
  }
  // Check email match
  const emailExists = await User.findOne({ email });
  if (emailExists) {
    throw new AppError("The email address is already in use", 400);
  }
  // Check phone match
  const phoneExists = await User.findOne({ phone });
  if (phoneExists) {
    throw new AppError("Phone number already in use", 400);
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
  // Generate email OTP
  const otp = user.createEmailVerificationOTP();
  await user.save();
  // Send verification email
  try {
    await sendEmail({
      email: user.email,
      subject: "Verify your email",
      message: `Your verification code is: ${otp}`,
    });
  } catch (err) {
    console.log("Email failed but user created");
  }
  return successCreateResponse(
    res,
    `User registered. Please verify your email`,
  );
});

//  [2] LOGIN USER
exports.login = asyncHandler(async (req, res) => {
  let { identifier, password } = req.body;
  // Data cleaning
  identifier = identifier.trim();
  password = password.trim();
  if (!identifier || !password) {
    throw new AppError("Please enter your email or username and password", 400);
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
  // Password verification
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError("Incorrect password", 400);
  }
  // is email validate
  if (!user.isVerified) {
    //  create new otp
    const otp = user.createEmailVerificationOTP();
    await user.save({ validateBeforeSave: false });
    // send email
    try {
      await sendEmail({
        email: user.email,
        subject: "Verify your email",
        message: `Your verification code is: ${otp}`,
      });
    } catch (error) {
      console.log("Email failed log in");
    }
    return errorResponse(
      res,
      `Account not verified. A new OTP has been sent to your email`,
    );
  }
  const token = createToken(user._id);
  return successResponse(res, "Login successfull", {
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

//  [3] FORGOT PASSWORD
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
  // // Reset OTP limit every 24h
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
  const otpExpire = Number(process.env.PASSWORD_OTP_EXPIRE_MINUTES) || 10;
  const message = `Your password reset code is: ${otp}. This code will expire in ${otpExpire} minutes.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password Reset Code",
      message,
    });
  } catch (error) {
    console.log("Email failed but forget password");
  }
  return successResponse(res, `OTP sent to email`);
});

//  [4] VERIFY EMAIL OTP for password
exports.verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    throw new AppError("Email and OTP are required", 400);
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
  await user.save();

  return successResponse(res, "OTP verified successfully");
});

//  [5] reset password
exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, password, confirmPassword } = req.body;
  if (!email || !otp || !password || !confirmPassword) {
    throw new AppError("All fields are required", 400);
  }
  if (password.includes(" ")) {
    throw new AppError("Password cannot contain spaces", 400);
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

//  [6] verify Email after register :
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  // 1️⃣ تحقق من البيانات
  if (!email || !otp) {
    throw new AppError("Email and OTP required", 400);
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

// CHECK AVAILABILITY
exports.checkAvailability = asyncHandler(async (req, res) => {
  const { username, email, phone } = req.query;
  // There must be only one parameter
  if (!username && !email && !phone) {
    return errorResponseForAvailabilityNoData(
      res,
      "Please provide username or email or phone",
    );
  }
  // username availability
  if (username) {
    const normalizedUsername = username.trim().toLowerCase();
    // user name lenght
    if (normalizedUsername.length < 3) {
      return errorResponseForHandred(
        res,
        "Username must be at least 3 characters long",
      );
    }
    const exists = await User.findOne({ username: normalizedUsername });
    if (exists) {
      return errorResponseForAvailability(res, "Username already in use");
    }
    return successResponseForAvailability(res, "Username available");
  }
  // email availability
  if (email) {
    const normalizedEmail = email.trim().toLowerCase();
    // email or not email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return errorResponseForHandred(res, "Invalid email format");
    }
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return errorResponseForAvailability(res, "Email already in use");
    }
    return successResponseForAvailability(res, "Email available");
  }
  // phone availability
  if (phone) {
    const normalizedPhone = phone.trim();
    // phone lenght
    const phoneRegex = /^[0-9]{8,15}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      return errorResponseForHandred(res, "Invalid phone number");
    }
    const exists = await User.findOne({ phone: normalizedPhone });
    if (exists) {
      return errorResponseForAvailability(res, "Phone already in use");
    }
    return successResponseForAvailability(res, "Phone available");
  }
});
