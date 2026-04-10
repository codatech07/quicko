const mongoose = require("mongoose");
const crypto = require("crypto");

const pendingUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    emailVerificationOTP: String,
    emailVerificationExpire: Date,
  },
  { timestamps: true }
);

// create OTP
pendingUserSchema.methods.createEmailVerificationRegOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.emailVerificationOTP = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
  const emailOtpExpire = Number(process.env.EMAIL_OTP_EXPIRE_MINUTES) || 60;
  this.emailVerificationExpire = Date.now() + emailOtpExpire * 60 * 1000;
  return otp;
};

module.exports = mongoose.model("PendingUser", pendingUserSchema);