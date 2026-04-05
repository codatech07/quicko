const express = require("express");
const router = express.Router();

const {
  getMe,
  updateMe,
  changePassword,
  getUserById,
  getAllUsers,
  deleteUser,
} = require("../controllers/userController");

const { protect } = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/adminMiddleware");

//  Profile
router.get("/me", protect, getMe);

// Update profile
router.put("/me", protect, updateMe);

// Change password
router.put("/change-password", protect, changePassword);

// 🛠️ Admin فقط
router.get("/", protect, isAdmin, getAllUsers);
router.get("/:id", protect, isAdmin, getUserById);
router.delete("/:id", protect, isAdmin, deleteUser);

module.exports = router;
