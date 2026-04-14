const express = require("express");
const app = express();
app.use(express.json());
// routes
app.get("/", (req, res) => {
  res.send("API is running...");
});
app.use("/api/auth", require("./routes/authRoute"));
//user
app.use("/api/users", require("./routes/userRoute"));
// shops
app.use("/api/shops", require("./routes/shopRoute"));
// product
app.use("/api/products", require("./routes/productRoute"));
// favorites routes
app.use("/api/favorites", require("./routes/favoriteRoute"));
// card 
app.use("/api/cart", require("./routes/cartRoute"));
// route not found handler
const AppError = require("./utils/AppError");

app.all(/.*/, (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});
// // error middleware
const errorHandler = require("./middlewares/errorMiddleware");
app.use(errorHandler);
module.exports = app;
