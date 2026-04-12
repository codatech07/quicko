const User = require("../models/userModel");
const PendingUser = require("../models/pendingUserModel");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const AppError = require("../utils/AppError");
const {
  usernameRegex,
  phoneRegex,
  passwordRegex,
  normalizePhone,
} = require("../utils/validators/authValidators");
const { successResponse, successDeleteResponse } = require("../utils/response");

// GET MY PROFILE
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  return successResponse(res, "Data retrieved successfully", user);
});

// UPDATE PROFILE (name + username + phone)
exports.updateMe = asyncHandler(async (req, res) => {
  let { name, username, phone } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError("لم يتم العثور على المستخدم", 404);
  }
  // USERNAME
  if (username) {
    username = username.trim().toLowerCase();
    if (!usernameRegex.test(username)) {
      throw new AppError(
        "يجب أن يتكون اسم المستخدم من 5 إلى 20 حرفا على الأقل،وان يتكون من حروفًا/أرقامًا، ويمكن أن يتضمن _ أو .",
        400,
      );
    }
    if (username !== user.username) {
      const [userUsername, pendingUsername] = await Promise.all([
        User.findOne({ username, _id: { $ne: user._id } }),
        PendingUser.findOne({ username }),
      ]);
      if (userUsername || pendingUsername) {
        throw new AppError("اسم المستخدم مستخدم بالفعل", 400);
      }
      user.username = username;
    }
  }
  // NAME
  if (name) {
    user.name = name.trim();
  }
  // PHONE
  if (phone) {
    phone = phone.trim();

    if (!phoneRegex.test(phone)) {
      throw new AppError("تنسيق رقم الهاتف غير صالح", 400);
    }
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      throw new AppError("تنسيق رقم الهاتف غير صالح", 400);
    }
    if (normalizedPhone !== user.phone) {
      const [userPhone, pendingPhone] = await Promise.all([
        User.findOne({ phone: normalizedPhone, _id: { $ne: user._id } }),
        PendingUser.findOne({ phone: normalizedPhone }),
      ]);

      if (userPhone || pendingPhone) {
        throw new AppError("رقم الهاتف مستخدم بالفعل", 400);
      }
      user.phone = normalizedPhone;
    }
  }
  await user.save();
  return successResponse(res, "تم تحديث البيانات بنجاح", user);
});

// CHANGE PASSWORD
exports.changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  // password validate
  if (!passwordRegex.test(newPassword)) {
    throw new AppError(
      "يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل وأن تتكون من 6 حروف أو أكثر، ولا يمكن أن تحتوي على مسافات",
      400,
    );
  }
  const user = await User.findById(req.user.id).select("+password");
  if (!user) {
    throw new AppError("لم يتم العثور على المستخدم", 404);
  }
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    throw new AppError("كلمة المرور القديمة غير صحيحة", 400);
  }
  if (newPassword !== confirmPassword) {
    throw new AppError("كلمات المرور غير متطابقة", 400);
  }
  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
  return successResponse(res, "تم تغيير كلمة المرور بنجاح");
});

// GET USER BY ID (Admin only)
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) {
    throw new AppError("لم يتم العثور على المستخدم", 404);
  }
  return successResponse(res, "تم استيراد المستخدم بنجاح", user);
});

// GET ALL USERS (Admin only)
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  return successResponse(res, "تم استيراد المستخدم بنجاح", {
    count: users.length,
    users,
  });
});

// DELETE USER (Admin only)
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError("لم يتم العثور على المستخدم", 404);
  }
  await user.deleteOne();
  return successDeleteResponse(res);
});

// GET PENDING USER BY ID (Admin only)
exports.getPendingUserById = asyncHandler(async (req, res) => {
  const user = await PendingUser.findById(req.params.id).select("-password");
  if (!user) {
    throw new AppError("لم يتم العثور على المستخدم", 404);
  }
  return successResponse(res, "تم استيراد المستخدم بنجاح", user);
});

// GET ALL PENDING USERS (Admin only)
exports.getAllPendingUsers = asyncHandler(async (req, res) => {
  const users = await PendingUser.find().select("-password");
  return successResponse(res, "تم استيراد المستخدمين بنجاح", {
    count: users.length,
    users,
  });
});

// DELETE PENDING USER (Admin only)
exports.deletePendingUser = asyncHandler(async (req, res) => {
  const user = await PendingUser.findById(req.params.id);
  if (!user) {
    throw new AppError("لم يتم العثور على المستخدم", 404);
  }
  await user.deleteOne();
  return successDeleteResponse(res);
});
