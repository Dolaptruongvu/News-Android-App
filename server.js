const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { app } = require("./app");

// Load biến môi trường từ file `config.env`
dotenv.config({ path: "./config.env" });

// Kết nối MongoDB
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Kết nối MongoDB thành công!"));

// Khởi động server
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});

// Xử lý lỗi không mong muốn
process.on("unhandledRejection", (err) => {
  console.log("❌ Lỗi unhandledRejection! Đóng server...");
  console.log(err.name,
