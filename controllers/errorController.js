const AppError = require("../utils/appError");

// Handle Sequelize-specific errors

const handleSequelizeUniqueConstraintError = (err) => {
  const message = `Duplicate field value: ${Object.values(err.fields).join(
    ", "
  )}. Please use another value!`;
  return new AppError(message, 400);
};

const handleSequelizeValidationError = (err) => {
  const errors = err.errors.map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleSequelizeDatabaseError = (err) => {
  return new AppError(`Database error: ${err.message}`, 500);
};

const handleJsonWebTokenError = () =>
  new AppError("Invalid token. Please log in again!", 401);

const handleTokenExpiredError = () =>
  new AppError("Your token has expired! Please log in again.", 401);

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    console.log("error", JSON.stringify(err));
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  console.log("error", JSON.stringify(err));
  return res.status(err.statusCode).render("error", {
    title: "Oops! Something went wrong!",
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    console.error("ERROR 💥", err);

    return res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }

  if (err.isOperational) {
    return res.status(err.statusCode).render("error", {
      title: "Oops! Something went wrong!",
      msg: err.message,
    });
  }

  console.error("ERROR 💥", err);

  return res.status(err.statusCode).render("error", {
    title: "Something went wrong",
    msg: "Please try again later.",
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    if (err.name === "SequelizeUniqueConstraintError") {
      err = handleSequelizeUniqueConstraintError(err);
    } else if (err.name === "SequelizeValidationError") {
      err = handleSequelizeValidationError(err);
    } else if (err.name === "SequelizeDatabaseError") {
      err = handleSequelizeDatabaseError(err);
    } else if (err.name === "JsonWebTokenError") {
      err = handleJsonWebTokenError();
    } else if (err.name === "TokenExpiredError") {
      err = handleTokenExpiredError();
    }

    sendErrorProd(err, req, res);
  }
};
