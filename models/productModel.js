const mongoose = require("mongoose");
const {
  PRODUCTCATEGORIES,
  PRODUCTCURRENCY,
  PRODUCTUNIT,
} = require("../utils/validators/constantsShopProduct");

/*
TAG: PRODUCT SCHEMA
الوظيفة:
تعريف بيانات المنتج داخل النظام
IMPORTANT:
- المنتج مربوط بمحل (shop)
- لازم يحتوي على صورة واحدة على الأقل
*/
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

    /*
    TAG: IMAGES
    الوظيفة:
    تخزين صور المنتج
    IMPORTANT:
    - لازم صورة واحدة على الأقل
    */
    images: {
      type: [
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
    /*
    TAG: RELATION WITH SHOP
    */
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
  },
  { timestamps: true },
);
/*
TAG: INDEXES
الوظيفة:
تسريع عمليات البحث والترتيب
*/
productSchema.index({ shop: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ sold: -1 });
productSchema.index({ views: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ shop: 1, category: 1 });

module.exports = mongoose.model("Product", productSchema);
