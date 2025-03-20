const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

const router = express.Router();

// ✅ Authentication Routes
router.post("/signup", authController.signup);
router.post("/login", authController.login);

// ✅ Protect all routes after this middleware
router.use(authController.protect);

// ✅ User Management Routes (only accessible when authenticated)
router.get("/", userController.getAllUsers);

// ✅ Restrict specific actions to certain roles
router.use(authController.restrictTo("admin"));
router.delete("/:id", userController.deleteUser); // Example admin-only route

module.exports = router;
