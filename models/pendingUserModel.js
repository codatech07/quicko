const mongoose = require("mongoose");
const crypto = require("crypto");

const pendingUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 5,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    resetPasswordOTP: String,
    resetPasswordExpire: Date,
    otpAttempts: {
      type: Number,
      default: 0,
    },
    otpLastAttempt: Date,
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationOTP: String,
    emailVerificationExpire: Date,
  },
  { timestamps: true },
);

// password update OTP
pendingUserSchema.methods.createPasswordResetOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.resetPasswordOTP = crypto.createHash("sha256").update(otp).digest("hex");
  const otpExpire = Number(process.env.PASSWORD_OTP_EXPIRE_MINUTES) || 10;
  this.resetPasswordExpire = Date.now() + otpExpire * 60 * 1000;
  return otp;
};

// email update OTP
pendingUserSchema.methods.createEmailVerificationOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.emailVerificationOTP = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
  const expireMinutes = Number(process.env.EMAIL_OTP_EXPIRE_MINUTES) || 20;
  this.emailVerificationExpire = Date.now() + expireMinutes * 60 * 1000;
  console.log("register otp created from pending shema");
  return otp;
};

module.exports = mongoose.model("PendingUser", pendingUserSchema);
