const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// إعداد التخزين في Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
  folder: "quicko-app",
  allowed_formats: ["jpg", "png", "jpeg", "webp"],
  public_id: `${Date.now()}-${file.originalname}`,
}),
});

const upload = multer({ storage });

module.exports = upload;