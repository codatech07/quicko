const AppError = require("../utils/AppError"); 

// GLOBAL ERROR HANDLER
const errorHandler = (err, req, res, next) => {

  // [LOG] Print full error in server console
  console.error("ERROR:", err);

  // [DEFAULT_ERROR]
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong";

  // [MONGO_ERROR] Duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already in use`;
    statusCode = 400;
  }

  // [MONGO_ERROR] Validation error
  if (err.name === "ValidationError") {
    message = Object.values(err.errors)
      .map((el) => el.message)
      .join(", ");
    statusCode = 400;
  }

  // [MONGO_ERROR] Invalid ObjectId
  if (err.name === "CastError") {
    message = "Invalid ID format";
    statusCode = 400;
  }

  // [JWT_ERROR] Invalid token
  if (err.name === "JsonWebTokenError") {
    message = "Invalid token";
    statusCode = 401;
  }

  // [JWT_ERROR] Expired token
  if (err.name === "TokenExpiredError") {
    message = "Token expired";
    statusCode = 401;
  }

  // [BODY_ERROR] Invalid JSON
  if (err.type === "entity.parse.failed") {
    message = "Invalid JSON format";
    statusCode = 400;
  }

  // [STACK_TRACE] Extract error location
  let errorLocation = null;

  if (err.stack) {
    const stackLines = err.stack.split("\n");
    const relevantLine = stackLines.find(
      (line) => line.includes(process.cwd()) && !line.includes("node_modules"),
    );
    errorLocation = relevantLine ? relevantLine.trim() : null;
  }

  // [RESPONSE] Send error response
  return res.status(statusCode).json({
    status: "error",
    message,

    // [DEBUG_MODE] Show extra debug info if enabled
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