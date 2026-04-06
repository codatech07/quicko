const express = require("express");
const app = express();
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

app.use(express.json());
app.use(helmet());

// api limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100, // 100 طلب
  message: "Too many requests, try again later",
});

app.use(limiter);

// routes
app.use("/api/auth", require("./routes/authRoute"));

//user
app.use("/api/users", require("./routes/userRoute"));

//  shops
app.use("/api/shops", require("./routes/shopRoute"));

// route not found handler
app.all(/.*/, (req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server`);
  err.statusCode = 404;
  next(err);
});

// error middleware
const errorHandler = require("./middlewares/errorMiddleware");
app.use(errorHandler);

module.exports = app;
