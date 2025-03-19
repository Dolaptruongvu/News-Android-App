const express = require("express");
const morgan = require("morgan");
const path = require("path");
const cookieParser = require("cookie-parser");
const AppError = require("./utils/appError");
const userRoutes = require("./routes/userRoutes");
const newsRoutes = require("./routes/newsRoutes");
const globalErrorHandler = require("./controllers/errorController");
const viewRouter = require("./routes/viewsRoutes");
const cors = require("cors");

// app area
const app = express();
app.enable("trust proxy");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Body parser, đọc dữ liệu từ body vào req.body
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// morgan để đọc log từ middleware
app.use(morgan("common"));

// CORS để frontend có thể gọi API
app.use(
  cors({
    origin: ["http://127.0.0.1:3000"],
    credentials: true,
  })
);

// Serving static files
app.use(express.static(path.join(__dirname, "public")));

// Middleware test
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// User routes
app.use("/api/v1/users", userRoutes);

// News routes
app.use("/api/v1/news", newsRoutes);

// View router
app.use("/", viewRouter);

// Test router
app.use("/test", (req, res) => {
  res.json({ statement: "Welcome to News App API!" });
});

// Global Error Handling Middleware
app.use(globalErrorHandler);

module.exports = { app };
