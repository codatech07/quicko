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

// ==========================
// Profile (User)
// ==========================
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.put("/change-password", protect, changePassword);

// ==========================
// Pending Users (Admin)
// ==========================
router.get("/pending", protect, isAdmin, getAllPendingUsers);
router.get("/pending/:id", protect, isAdmin, getPendingUserById);
router.delete("/pending/:id", protect, isAdmin, deletePendingUser);

// ==========================
// Users (Admin)
// ==========================
router.get("/", protect, isAdmin, getAllUsers);
router.get("/:id", protect, isAdmin, getUserById);
router.delete("/:id", protect, isAdmin, deleteUser);

module.exports = router;