const express = require("express");
const router = express.Router();
const productRoute = require("./productRoute");
const upload = require("../middlewares/uploadMiddleware");
const {
  createShop,
  getShops,
  getShopById,
  updateShop,
  deleteShop,
} = require("../controllers/shopController");
const { protect } = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/adminMiddleware");

// Everyone sees
router.get("/", getShops);
router.get("/:id", getShopById);
// 🔥 nested route
router.use("/:shopId/products", productRoute);
// Admin only
router.post("/", protect, isAdmin,upload.array("images", 5), createShop);
router.put("/:id", protect, isAdmin,upload.array("images", 5), updateShop);
router.delete("/:id", protect, isAdmin, deleteShop);

module.exports = router;
