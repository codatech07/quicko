const express = require("express");
const app = express();
const { globalLimiter } = require("./middlewares/rateLimitMiddleware");
const errorHandler = require("./middlewares/errorMiddleware");

// [MIDDLEWARE] Parse JSON body
app.use(express.json());

// [ROUTES] Root route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// [ROUTES] Authentication routes
app.use("/api/auth", require("./routes/authRoute"));

// [MIDDLEWARE] global request limit
app.use(globalLimiter);

// [ROUTES] User routes
app.use("/api/users", require("./routes/userRoute"));

// [ROUTES] Shop routes
app.use("/api/shops", require("./routes/shopRoute"));

// [ROUTES] Product routes
app.use("/api/products", require("./routes/productRoute"));

// [ROUTES] Favorite routes
app.use("/api/favorites", require("./routes/favoriteRoute"));

// [ROUTES] Cart routes
app.use("/api/cart", require("./routes/cartRoute"));

// [ROUTES] Address routes
app.use("/api/address", require("./routes/addressRoute"));

// [ERROR] AppError class
const AppError = require("./utils/AppError");

// [404 HANDLER] Route not found
app.all(/.*/, (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// [ERROR MIDDLEWARE] Global error handler
app.use(errorHandler);

// [EXPORT] Export Express app
module.exports = app;
