const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // 🔥 Mongo duplicate
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already in use`;
    statusCode = 400;
  }

  // 🔥 Mongoose validation error
  if (err.name === "ValidationError") {
    message = Object.values(err.errors)
      .map((el) => el.message)
      .join(", ");
    statusCode = 400;
  }

  // 🔥 Cast error (مثلاً ID غلط)
  if (err.name === "CastError") {
    message = "Invalid ID format";
    statusCode = 400;
  }

  res.status(statusCode).json({
    status: "error",
    message,
  });
};

module.exports = errorHandler;
