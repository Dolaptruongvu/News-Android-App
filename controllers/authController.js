const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const catchAsync = require("../utils/catchAsync");

// Function to generate JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// ✅ **User Signup**
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const token = signToken(newUser._id);
  res.status(201).json({
    status: "success",
    token,
    data: {
      user: newUser,
    },
  });
});

// ✅ **User Login**
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1️⃣ Check if email or password is missing
  if (!email || !password) {
    return res
      .status(400)
      .json({ status: "fail", message: "Please provide email and password!" });
  }

  // 2️⃣ Find user by email and include password field
  const user = await User.findOne({ email }).select("+password");

  // 3️⃣ Check if user does not exist or if password is incorrect
  if (!user || !(await user.correctPassword(password, user.password))) {
    return res
      .status(401)
      .json({ status: "fail", message: "Incorrect email or password!" });
  }

  // 4️⃣ If password is correct, generate token and send response
  const token = signToken(user._id);
  res.status(200).json({ status: "success", token });
});

// ✅ **Middleware to protect routes (Check JWT token)**
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ status: "fail", message: "You are not logged in!" });
  }

  // 2️⃣ Verify JWT token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 3️⃣ Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return res
      .status(401)
      .json({ status: "fail", message: "User no longer exists!" });
  }

  // 4️⃣ Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return res.status(401).json({
      status: "fail",
      message: "User recently changed password. Please log in again!",
    });
  }

  req.user = currentUser;
  next();
});

// ✅ **Middleware to restrict access to certain roles (admin, user, etc.)**
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to perform this action!",
      });
    }
    next();
  };
};
