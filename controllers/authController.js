const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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

  const user = await User.create({
    name,
    username,
    email,
    phone,
    password: hashedPassword,
  });

  const token = createToken(user._id);
  res.status(201).json({
    message: "User created",
    token,
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
  });
});
