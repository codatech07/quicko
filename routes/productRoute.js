const express = require("express");
const router = express.Router({ mergeParams: true });

const {
  createProduct,
  getShopProducts,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const { protect } = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/adminMiddleware");

// ========================
// 🟢 CREATE PRODUCT
// ========================
router.post("/", protect, isAdmin, createProduct);

// ========================
// 🟢 GET ALL PRODUCTS (GLOBAL FILTER)
// ========================
router.get("/", getAllProducts);

// ========================
// 🟢 GET PRODUCTS OF A SHOP
// ========================
router.get("/shop/:shopId", getShopProducts);

// ========================
// 🟢 GET SINGLE PRODUCT
// ========================
router.get("/:productId", getProductById);

// ========================
// 🟡 UPDATE PRODUCT
// ========================
router.put("/:productId", protect, isAdmin, updateProduct);

// ========================
// 🔴 DELETE PRODUCT
// ========================
router.delete("/:productId", protect, isAdmin, deleteProduct);


module.exports = router;