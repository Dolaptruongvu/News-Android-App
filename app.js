const express = require("express");
const morgan = require("morgan");
const path = require("path");
const cookieParser = require("cookie-parser");
const AppError = require("./utils/appError");
const userRoutes = require("./routes/userRoutes");
const newsRoutes = require("./routes/newsRoutes");
const globalErrorHandler = require("./controllers/errorController");
const cors = require("cors");

// app area
const app = express();
app.enable("trust proxy");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

app.use(morgan("common"));

app.use(
  cors({
    origin: ["http://127.0.0.1:5000"],
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

// Test router
app.use("/test", (req, res) => {
  res.json({ statement: "Welcome to News App API!" });
});

// Global Error Handling Middleware
app.use(globalErrorHandler);

module.exports = app;
