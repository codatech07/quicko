const cloudinary = require("cloudinary").v2;

/*
TAG: CLOUDINARY CONFIGURATION
الوظيفة:
إعداد cloudinary لرفع الصور
IMPORTANT:
 يعتمد على environment variables
*/
// STEP 1: إعداد بيانات الاتصال
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// STEP 2: تصدير الإعداد
module.exports = cloudinary;