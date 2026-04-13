const express = require("express");
const router = express.Router();

const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const { protect } = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/adminMiddleware");

// 🟢 ALL PRODUCTS
router.get("/", getAllProducts);

// 🟢 SINGLE PRODUCT
router.get("/:productId", getProductById);

// 🟢 CREATE (بدنا shopId من body)
router.post("/", protect, isAdmin, createProduct);

// 🟡 UPDATE
router.put("/:productId", protect, isAdmin, updateProduct);

// 🔴 DELETE
router.delete("/:productId", protect, isAdmin, deleteProduct);

module.exports = router;