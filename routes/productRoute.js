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

// 🟢 1. specific routes أول شي
router.get("/shops/:shopId/products", getShopProducts);

// 🟢 2. all products
router.get("/", getAllProducts);

// 🟢 3. single product (لازم يجي بعد كل شي)
router.get("/:productId", getProductById);

// 🟢 create
router.post("/", protect, isAdmin, createProduct);

// 🟡 update
router.put("/:productId", protect, isAdmin, updateProduct);

// 🔴 delete
router.delete("/:productId", protect, isAdmin, deleteProduct);

module.exports = router;