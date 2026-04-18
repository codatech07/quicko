const mongoose = require("mongoose");
const {
  PRODUCTCATEGORIES,
  PRODUCTCURRENCY,
  PRODUCTUNIT,
} = require("../utils/validators/constantsShopProduct");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name required"],
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: PRODUCTCATEGORIES,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price must be greater than 0"],
    },
    oldPrice: {
      type: Number,
      default: 0,
      min: [0, "old Price must be greater than 0"],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    currency: {
  type: String,
  required: true,
  enum: PRODUCTCURRENCY,
  trim: true,
},
unit: {
  type: String,
  required: true,
  enum: PRODUCTUNIT,
  trim: true,
},
    // 🖼️ الصور (لازم صورة على الأقل)
    images: [
  {
    url: String,
    public_id: String,
  },
],
      required: true,
      validate: {
        validator: function (arr) {
          return arr.length > 0;
        },
        message: "At least one image is required",
      },
    },
    // 🔥 عدد المبيعات
    sold: {
      type: Number,
      default: 0,
    },
    // 👁️ عدد المشاهدات
    views: {
      type: Number,
      default: 0,
    },
    // ⭐ التقييم
    ratingAvg: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    // 🔗 أهم شي: ربط المنتج بالمحل
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
  },
  { timestamps: true },
);

// 🔥 indexes مهمة للمستقبل
productSchema.index({ shop: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ sold: -1 });
productSchema.index({ views: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ shop: 1, category: 1 });

module.exports = mongoose.model("Product", productSchema);
