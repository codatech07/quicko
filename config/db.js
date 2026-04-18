const mongoose = require("mongoose");

/*
DATABASE CONNECTION
الوظيفة:
الاتصال بقاعدة البيانات MongoDB باستخدام Mongoose
IMPORTANT:
إذا فشل الاتصال → التطبيق بيوقف (process.exit)
*/
// Connect to MongoDB database using Mongoose
const connectDB = async () => {
  try {
    // STEP 1: محاولة الاتصال بقاعدة البيانات
    await mongoose.connect(process.env.MONGO_URI);
    // STEP 2: نجاح الاتصال
    console.log("DB Connected Successfully");
  } catch (err) {
    // STEP 3: في حال فشل الاتصال
    console.error(err);
    // IMPORTANT: إيقاف السيرفر بالكامل
    process.exit(1);
  }
};

module.exports = connectDB;
