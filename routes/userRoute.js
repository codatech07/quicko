const express = require("express");
const router = express.Router();
const {
  getMe,
  updateMe,
  changePassword,
  getUserById,
  getAllUsers,
  deleteUser,
  getAllPendingUsers,
  getPendingUserById,
  deletePendingUser,
} = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/adminMiddleware");
// Profile
router.get("/me", protect, getMe);
// Update profile
router.put("/me", protect, updateMe);
// Change password
router.put("/change-password", protect, changePassword);
// 🛠️ Admin فقط
router.get("/", protect, isAdmin, getAllUsers);
router.get("/:id", protect, isAdmin, getUserById);
router.delete("/:id", protect, isAdmin, deleteUser);
// Pending Users (Admin only)
router.get("/pending", protect, isAdmin, getAllPendingUsers);
router.get("/pending/:id", protect, isAdmin, getPendingUserById);
router.delete("/pending/:id", protect, isAdmin, deletePendingUser);
module.exports = router;
