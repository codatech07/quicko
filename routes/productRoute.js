const express = require("express");
const router = express.Router({ mergeParams: true });

const { createProduct } = require("../controllers/productController");
const { protect } = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/adminMiddleware");

// 🔥 create product
router.post("/", protect, isAdmin, createProduct);

module.exports = router;