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

// OTP
pendingUserSchema.methods.createEmailVerificationOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  this.emailVerificationOTP = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");

  const expireMinutes =
    Number(process.env.EMAIL_OTP_EXPIRE_MINUTES) || 20;

  this.emailVerificationExpire =
    Date.now() + expireMinutes * 60 * 1000;
    console.log("register otp created from pending shema");

  return otp;
};

module.exports = mongoose.model("PendingUser", pendingUserSchema);