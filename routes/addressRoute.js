const express = require("express");
const router = express.Router();
const { isAdmin } = require("../middlewares/adminMiddleware");


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
// get address by user ıd
router.get("/user/:userId", protect, isAdmin, getAddressByUserId);

module.exports = router;