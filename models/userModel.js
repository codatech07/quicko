const mongoose = require("mongoose");
const crypto = require("crypto");
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    resetPasswordOTP: String,
    resetPasswordExpire: Date,
    otpAttempts: {
      type: Number,
      default: 0,
    },
    otpLastAttempt: Date,
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationOTP: String,
    emailVerificationExpire: Date,
  },
  { timestamps: true },
);

// password update
userSchema.methods.createPasswordResetOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.resetPasswordOTP = crypto.createHash("sha256").update(otp).digest("hex");
  const otpExpire = Number(process.env.PASSWORD_OTP_EXPIRE_MINUTES) || 10;
  this.resetPasswordExpire = Date.now() + otpExpire * 60 * 1000;
  return otp;
};
userSchema.methods.createEmailVerificationOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.emailVerificationOTP = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
  const emailOtpExpire = Number(process.env.EMAIL_OTP_EXPIRE_MINUTES) || 60;
  this.emailVerificationExpire = Date.now() + emailOtpExpire * 60 * 1000;
  return otp;
};
module.exports = mongoose.model("User", userSchema);
