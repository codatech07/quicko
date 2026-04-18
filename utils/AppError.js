// [BASE_CLASS] Extends native JavaScript Error class
class AppError extends Error {
  constructor(message, statusCode) {
    // [PARENT_INIT] Call native Error constructor
    super(message);

    // [HTTP_STATUS] HTTP status code (400, 404, 500...)
    this.statusCode = statusCode;

    // [STATUS_TYPE] Determine error type (fail or error)
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    // [OPERATIONAL_ERROR] Mark as expected error (not bug)
    this.isOperational = true;

    // [STACK_TRACE] Capture stack trace without constructor noise
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
