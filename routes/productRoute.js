const express = require("express");
const router = express.Router();

const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getShopProducts
} = require("../controllers/productController");

const { protect } = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/adminMiddleware");

// 🟢 ALL PRODUCTS
router.get("/", getAllProducts);

// 🟢 PRODUCTS BY SHOP
router.get("/shop/:shopId", getShopProducts);

// 🟢 SINGLE PRODUCT
router.get("/:productId", getProductById);

// 🟢 CREATE PRODUCT (🔥 FIXED)
router.post("/shop/:shopId", protect, isAdmin, createProduct);

// 🟡 UPDATE
router.put("/:productId", protect, isAdmin, updateProduct);

// 🔴 DELETE
router.delete("/:productId", protect, isAdmin, deleteProduct);

module.exports = router;