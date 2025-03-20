const express = require("express");
const newsController = require("../controllers/newsController");
const authController = require("../controllers/authController");

const router = express.Router();

// 🔹 Route để fetch tin tức từ API bên thứ ba và lưu vào database
router.get("/fetch", newsController.fetchAndStoreNews);
// 🔹 Lấy tất cả tin tức từ database
router.get("/", newsController.getAllNews);

router.get("/:id", newsController.getNewsById);

// 🔹 Các route dưới đây chỉ dành cho admin
router.post(
  "/",
  authController.protect,
  authController.restrictTo("admin"),
  newsController.createNews
);
router.patch(
  "/:id",
  authController.protect,
  authController.restrictTo("admin"),
  newsController.updateNews
);
router.delete(
  "/:id",
  authController.protect,
  authController.restrictTo("admin"),
  newsController.deleteNews
);

module.exports = router;
