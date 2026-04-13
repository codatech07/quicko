const express = require("express");
const router = express.Router({ mergeParams: true });

const {
  createProduct,
  getShopProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const { protect } = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/adminMiddleware");

// create product
router.post("/", protect, isAdmin, createProduct);

// get all products of shop
router.get("/", getShopProducts);

// get product by id
router.get("/:productId", getProductById);

// update product
router.put("/:productId", protect, isAdmin, updateProduct);

// delete product
router.delete("/:productId", protect, isAdmin, deleteProduct);

module.exports = router;