const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");

// ✅ Get all users (only accessible when logged in)
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({ status: "success", data: users });
});

// ✅ Delete user (only for admin)
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return res.status(404).json({ status: "fail", message: "User not found" });
  }

  res.status(204).json({ status: "success", data: null });
});
