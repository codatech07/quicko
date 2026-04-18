const express = require("express");
const router = express.Router();

const {
  createAddress,
  updateAddress,
  getMyAddress,
  deleteAddress,
} = require("../controllers/addressController");
const { protect } = require("../middlewares/authMiddleware");
// ➕ create
router.post("/", protect, createAddress);
// ✏️ update
router.put("/", protect, updateAddress);
// 📥 get
router.get("/", protect, getMyAddress);
// ❌ delete
router.delete("/", protect, deleteAddress);

module.exports = router;