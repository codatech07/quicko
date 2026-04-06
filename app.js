const express = require("express");
const app = express();
app.use(express.json());
// routes
app.use("/api/auth", require("./routes/authRoute"));
//user
app.use("/api/users", require("./routes/userRoute"));
// shops
app.use("/api/shops", require("./routes/shopRoute"));
// route not found handler
app.all(/.*/, (req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server`);
  err.statusCode = 404;
  next(err);
});
// // error middleware
const errorHandler = require("./middlewares/errorMiddleware");
app.use(errorHandler);
module.exports = app;
