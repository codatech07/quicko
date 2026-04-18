const multer = require("multer"); // [LIB] Middleware for handling multipart/form-data (file uploads)
const { CloudinaryStorage } = require("multer-storage-cloudinary"); // [STORAGE_ADAPTER] Connect multer with Cloudinary
const cloudinary = require("../config/cloudinary"); // [CONFIG] Cloudinary instance

// CLOUDINARY STORAGE CONFIG
const storage = new CloudinaryStorage({
  // [SERVICE] Cloudinary instance
  cloudinary: cloudinary,

  // [FILE_CONFIG] Upload settings
  params: async (req, file) => ({
    // [FOLDER] Cloudinary folder name
    folder: "quicko-app",
    // [VALIDATION] Allowed file formats
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    // [FILE_NAME] Unique public ID for file
    public_id: `${Date.now()}-${file.originalname}`,
  }),
});
// MULTER INSTANCE
const upload = multer({ storage }); // [MIDDLEWARE] Upload handler using Cloudinary storage

// EXPORT
module.exports = upload;