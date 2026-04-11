const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const AppError = require("../utils/AppError");
const PendingUser = require("../models/pendingUserModel");
const {
  successResponse,
  errorResponse,
  successCreateResponse,
  errorResponseForAvailability,
  successResponseForAvailability,
  errorResponseForAvailabilityNoData,
  errorResponseForHandred,
} = require("../utils/response");
const {
  usernameRegex,
  emailRegex,
  phoneRegex,
  passwordRegex,
  normalizePhone,
} = require("../utils/validators/authValidators");

// Create a token
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

//  [1] REGISTER USER
exports.register = asyncHandler(async (req, res) => {
  // Extract and normalize input
  let { name, username, email, phone, password, confirmPassword } = req.body;
  // A. Data cleaning
  name = name.trim();
  username = username.trim().toLowerCase();
  email = email.trim().toLowerCase();
  phone = phone.trim();
  // Ensure all fields exist
  if (!name || !username || !email || !phone || !password || !confirmPassword) {
    throw new AppError("All fields are required", 400);
  }
  // Username validation
  if (!usernameRegex.test(username)) {
    throw new AppError(
      "Username must be 5-20 chars, letters/numbers, can include _ or .",
      400,
    );
  }
  // Email validation
  if (!emailRegex.test(email)) {
    throw new AppError("Invalid email format", 400);
  }
  // phone
  if (!phoneRegex.test(phone)) {
    throw new AppError("Invalid phone number format", 400);
  }
  // password (Medium strength) Password strength validation
  if (!passwordRegex.test(password)) {
    throw new AppError(
      "Password must contain at least 1 uppercase letter and be 4+ characters,can't include space",
      400,
    );
  }
  // Check password match
  if (password !== confirmPassword) {
    throw new AppError("The passwords do not match", 400);
  }
  // B.normalize phone in data
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    throw new AppError("Invalid phone number format", 400);
  }
  // B. match the password and username and email and phone From user and pending user
  // Check username match from user and pending user
  const [userUsername, pendingUsername] = await Promise.all([
    User.findOne({ username }),
    PendingUser.findOne({ username }),
  ]);
  if (userUsername || pendingUsername) {
    throw new AppError("Username already in use", 400);
  }
  // Check email match from user and pending user
  const [userEmail, pendingEmail] = await Promise.all([
    User.findOne({ email }),
    PendingUser.findOne({ email }),
  ]);
  if (userEmail || pendingEmail) {
    throw new AppError("The email address is already in use", 400);
  }
  // Check phone match from user and pending user
  const [userPhone, pendingPhone] = await Promise.all([
    User.findOne({ phone: normalizedPhone }),
    PendingUser.findOne({ phone: normalizedPhone }),
  ]);
  if (userPhone || pendingPhone) {
    throw new AppError("Phone number already in use", 400);
  }
  // C. password hashed and create pending user in db
  // password encryption
  const hashedPassword = await bcrypt.hash(password, 12);
  const pendingUser = new PendingUser({
    name,
    username,
    email,
    phone: normalizedPhone,
    password: hashedPassword,
    isVerified: false,
  });
  // D. * Generate email OTP {OTP form pending user}
  //    * save pending user
  const otp = pendingUser.createEmailVerificationOTP();
  await pendingUser.save();
  // E. Send verification email
  try {
    await sendEmail({
      email: pendingUser.email,
      subject: "Verify your email",
      message: `Your verification code is: ${otp}`,
    });
  } catch (err) {
    console.log("Email failed but user created");
  }
  // E. Respone
  return successCreateResponse(
    res,
    `User registered. Please verify your email`,
  );
});

//  [2] verify Email after register
exports.verifyEmail = asyncHandler(async (req, res) => {
  let { email, otp } = req.body;
  // A. Data cleaning
  email = email.trim().toLowerCase();
  otp = otp.trim();
  // B . email and otp required
  if (!email || !otp) {
    throw new AppError("Email and OTP required", 400);
  }
  // B. hashed password and find the user
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
  const pendingUser = await PendingUser.findOne({
    email,
    emailVerificationOTP: hashedOTP,
    emailVerificationExpire: { $gt: Date.now() },
  });
  // C. chek the email and otp :
  if (!pendingUser) {
    throw new AppError("Invalid or expired OTP", 400);
  }
  // D. create user in db user and verified true
  const user = await User.create({
    name: pendingUser.name,
    username: pendingUser.username,
    email: pendingUser.email,
    phone: pendingUser.phone,
    password: pendingUser.password,
    isVerified: true,
  });
  // E. delete pending user from db pending user
  await PendingUser.deleteOne({ _id: pendingUser._id });
  const token = createToken(user._id);
  // F. Response
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

//  [3] LOGIN USER
exports.login = asyncHandler(async (req, res) => {
  let { identifier, password } = req.body;
  // A. Data cleaning
  identifier = identifier.trim();
  password = password.trim();
  // B. email or user name required
  if (!identifier || !password) {
    throw new AppError("Please enter your email or username and password", 400);
  }
  // C. Specify whether it is email or username
  const isEmail = identifier.includes("@");
  const query = isEmail
    ? { email: identifier.toLowerCase() }
    : { username: identifier.toLowerCase() };
  // C. 1. search in all user and pending user
  const [user, pendingUser] = await Promise.all([
    User.findOne(query).select("+password"),
    PendingUser.findOne(query),
  ]);
  //      2. if not found anywhere
  if (!user && !pendingUser) {
    throw new AppError("User not found", 404);
  }
  // D. if user in pending user db
  //    1.check the password and create otp
  if (pendingUser) {
    const isMatch = await bcrypt.compare(password, pendingUser.password);
    if (!isMatch) {
      throw new AppError("Incorrect password", 401);
    }
    const otp = pendingUser.createEmailVerificationOTP();
    await pendingUser.save({ isVerified: false });
    try {
      await sendEmail({
        email: pendingUser.email,
        subject: "Verify your email",
        message: `Your verification code is: ${otp}`,
      });
    } catch (err) {
      console.log("send email failed but paassword ok");
    }
    return errorResponse(
      res,
      "Account not verified. Please check your email for verification code",
    );
  }
  // E. if user in user db
  //    1.check the password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError("Incorrect password", 400);
  }
  //    1.create token and log in
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

//  [4]and[5]and[6] for reset password
//  [4] FORGOT PASSWORD
exports.forgotPassword = asyncHandler(async (req, res) => {
  let { email } = req.body;
  email = email.trim().toLowerCase();
  // A. email is required
  if (!email) {
    throw new AppError("Email is required", 400);
  }
  // B. serch for email from user and pending user
  const [user, pendingUser] = await Promise.all([
    User.findOne({ email }),
    PendingUser.findOne({ email }),
  ]);
  if (!user && !pendingUser) {
    throw new AppError("User not found", 404);
  }
  //  C. email in pending user
  if (pendingUser) {
    const now = Date.now();
    // Reset OTP limit every 24h
    if (
      pendingUser.otpLastAttempt &&
      now - pendingUser.otpLastAttempt > 24 * 60 * 60 * 1000
    ) {
      pendingUser.otpAttempts = 0;
    }
    // If the limit is reached
    if (pendingUser.otpAttempts >= 5) {
      throw new AppError("You reached max OTP requests today", 429);
    }
    // Attempts 4 and 5 require waiting.
    if (pendingUser.otpAttempts >= 3) {
      if (
        pendingUser.otpLastAttempt &&
        now - pendingUser.otpLastAttempt < 30 * 60 * 1000
      ) {
        throw new AppError("Wait 30 minutes before requesting again", 429);
      }
    }
    // create reset password otp
    const otp = pendingUser.createPasswordResetOTP();
    // Update attempts for OTP
    pendingUser.otpAttempts += 1;
    pendingUser.otpLastAttempt = now;
    await pendingUser.save({ validateBeforeSave: false });
    const otpExpire = Number(process.env.PASSWORD_OTP_EXPIRE_MINUTES) || 10;
    try {
      await sendEmail({
        email: pendingUser.email,
        subject: "Verify your email",
        message: `Your password reset code is: ${otp}. This code will expire in ${otpExpire} minutes.`,
      });
    } catch (err) {
      console.log("send email failed");
    }
    return successResponse(res, `OTP sent to email`);
  }

  // D. email in user
  if (user) {
    const now = Date.now();
    // Reset OTP limit every 24h
    if (
      user.otpLastAttempt &&
      now - user.otpLastAttempt > 24 * 60 * 60 * 1000
    ) {
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
    // create reset password otp
    const otp = user.createPasswordResetOTP();
    // Update attempts for OTP
    user.otpAttempts += 1;
    user.otpLastAttempt = now;
    await user.save({ validateBeforeSave: false });
    const otpExpire = Number(process.env.PASSWORD_OTP_EXPIRE_MINUTES) || 10;
    try {
      await sendEmail({
        email: user.email,
        subject: "Verify your email",
        message: `Your password reset code is: ${otp}. This code will expire in ${otpExpire} minutes.`,
      });
    } catch (err) {
      console.log("send email failed");
    }
    return successResponse(res, `OTP sent to email`);
  }
});

//  [5] VERIFY EMAIL OTP for password
exports.verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    throw new AppError("Email and OTP are required", 400);
  }
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
  const [user, pendingUser] = await Promise.all([
    User.findOne({
      email,
      resetPasswordOTP: hashedOTP,
      resetPasswordExpire: { $gt: Date.now() },
    }),
    PendingUser.findOne({
      email,
      resetPasswordOTP: hashedOTP,
      resetPasswordExpire: { $gt: Date.now() },
    }),
  ]);
  if (!user && !pendingUser) {
    throw new AppError("Invalid or expired OTP", 400);
  }
  const targetUser = user || pendingUser;
  await targetUser.save({ validateBeforeSave: false });
  return successResponse(res, "OTP verified successfully");
});

//  [6] reset password
exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, password, confirmPassword } = req.body;
  if (!email || !otp || !password || !confirmPassword) {
    throw new AppError("All fields are required", 400);
  }
  if (!passwordRegex.test(password)) {
    throw new AppError(
      "Password must contain at least 1 uppercase letter and be 4+ characters,can't include space",
      400,
    );
  }
  if (password !== confirmPassword) {
    throw new AppError("Passwords do not match", 400);
  }
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
  const [user, pendingUser] = await Promise.all([
    User.findOne({
      email,
      resetPasswordOTP: hashedOTP,
      resetPasswordExpire: { $gt: Date.now() },
    }),
    PendingUser.findOne({
      email,
      resetPasswordOTP: hashedOTP,
      resetPasswordExpire: { $gt: Date.now() },
    }),
  ]);
  const targetUser = user || pendingUser;
  if (!targetUser) {
    throw new AppError("OTP invalid or expired", 400);
  }
  targetUser.password = await bcrypt.hash(password, 12);
  targetUser.resetPasswordOTP = undefined;
  targetUser.resetPasswordExpire = undefined;
  await targetUser.save();
  return successResponse(res, "Password reset successful");
});
// [7] CHECK AVAILABILITY
exports.checkAvailability = asyncHandler(async (req, res) => {
  const { username, email, phone } = req.query;
  if (!username && !email && !phone) {
    return errorResponseForAvailabilityNoData(
      res,
      "Please provide username or email or phone",
    );
  }
  // USERNAME
  if (username) {
    const normalizedUsername = username.trim().toLowerCase();
    if (!usernameRegex.test(normalizedUsername)) {
      return errorResponseForHandred(
        res,
        "Invalid username format (5-20 chars, letters/numbers, . or _)",
      );
    }
    const [user, pendingUser] = await Promise.all([
      User.findOne({ username: normalizedUsername }),
      PendingUser.findOne({ username: normalizedUsername }),
    ]);
    if (user || pendingUser) {
      return errorResponseForAvailability(res, "Username already in use");
    }
    return successResponseForAvailability(res, "Username available");
  }
  // EMAIL
  if (email) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      return errorResponseForHandred(res, "Invalid email format");
    }
    const [user, pendingUser] = await Promise.all([
      User.findOne({ email: normalizedEmail }),
      PendingUser.findOne({ email: normalizedEmail }),
    ]);
    if (user || pendingUser) {
      return errorResponseForAvailability(res, "Email already in use");
    }
    return successResponseForAvailability(res, "Email available");
  }
  // PHONE
  if (phone) {
    if (!phoneRegex.test(phone)) {
      return errorResponseForHandred(res, "Invalid phone number format");
    }
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return errorResponseForHandred(res, "Invalid phone number");
    }
    const [user, pendingUser] = await Promise.all([
      User.findOne({ phone: normalizedPhone }),
      PendingUser.findOne({ phone: normalizedPhone }),
    ]);
    if (user || pendingUser) {
      return errorResponseForAvailability(res, "Phone already in use");
    }
    return successResponseForAvailability(res, "Phone available");
  }
});

// [8] log out
exports.logout = asyncHandler(async (req, res) => {
  return successResponse(res, "Logged out successfully");
});
