const AppError = require("../utils/AppError");

const errorHandler = (err, req, res, next) => {
  console.error("💥 ERROR:", err);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong";

  // Mongo Errors

  // Duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already in use`;
    statusCode = 400;
  }

  // Validation
  if (err.name === "ValidationError") {
    message = Object.values(err.errors)
      .map((el) => el.message)
      .join(", ");
    statusCode = 400;
  }

  // Invalid ObjectId
  if (err.name === "CastError") {
    message = "Invalid ID format";
    statusCode = 400;
  }

  // JWT Errors

  if (err.name === "JsonWebTokenError") {
    message = "Invalid token";
    statusCode = 401;
  }

  if (err.name === "TokenExpiredError") {
    message = "Token expired";
    statusCode = 401;
  }

  // JSON Parse Error

  if (err.type === "entity.parse.failed") {
    message = "Invalid JSON format";
    statusCode = 400;
  }

  // Extract Error Location
  let errorLocation = null;

  if (err.stack) {
    const stackLines = err.stack.split("\n");

    const relevantLine = stackLines.find(
      (line) => line.includes(process.cwd()) && !line.includes("node_modules"),
    );

    errorLocation = relevantLine ? relevantLine.trim() : null;
  }

  // Response (FULL DEBUG ALWAYS)
  return res.status(statusCode).json({
    status: "error",
    message,
     ...(process.env.SHOW_STACK === "true" && {
    location: errorLocation,
    stack: err.stack,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
    }),
  });
};

module.exports = errorHandler;
