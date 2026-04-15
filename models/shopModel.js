const mongoose = require("mongoose");
const { SHOPCATEGORIES } = require("../utils/validators/constantsShopProduct");
const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Shop name required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      required: true,
    },
    category: {
      type: String,
      required: [true, "category required"],
      enum: SHOPCATEGORIES,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    phone: {
      type: String,
      required: [true, "Contact number required"],
    },
    address: {
      type: String,
      required: [true, "Address required"],
      trim: true,
    },
    ratingAvg: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);
module.exports = mongoose.model("Shop", shopSchema);
