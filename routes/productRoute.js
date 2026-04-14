const express = require("express");
const router = express.Router();
const upload = require("../middlewares/uploadMiddleware");
const { optionalAuth } = require("../middlewares/optionalAuth");


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
router.get("/",optionalAuth, getAllProducts);

// 🟢 PRODUCTS BY SHOP
router.get("/shop/:shopId",optionalAuth, getShopProducts);

// 🟢 SINGLE PRODUCT
router.get("/:productId",optionalAuth, getProductById);

// 🟢 CREATE PRODUCT (🔥 FIXED)
router.post("/shop/:shopId", protect, isAdmin, upload.array("images", 5), createProduct);

// 🟡 UPDATE
router.put("/:productId", protect, isAdmin, upload.array("images", 5), updateProduct);

// 🔴 DELETE
router.delete("/:productId", protect, isAdmin, deleteProduct);

module.exports = router;