exports.addToCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  const quantity = Number(req.body?.quantity) || 1;

  if (quantity <= 0) {
    throw new AppError("Quantity must be at least 1", 400);
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // ❌ إذا المنتج خالص
  if (product.stock === 0) {
    throw new AppError("Product is out of stock", 400);
  }

  let cart = await Cart.findOne({ user: userId });

  // 🆕 create cart
  if (!cart) {
    // ❌ check stock
    if (quantity > product.stock) {
      throw new AppError("Not enough stock available", 400);
    }

    cart = await Cart.create({
      user: userId,
      items: [
        {
          product: productId,
          quantity,
          price: product.price,
        },
      ],
      totalPrice: product.price * quantity,
    });

    return successResponse(res, "Cart created & product added", cart);
  }

  const item = cart.items.find(
    (i) => i.product.toString() === productId
  );

  if (item) {
    // ❌ تحقق من الكمية الجديدة
    const newQuantity = item.quantity + quantity;

    if (newQuantity > product.stock) {
      throw new AppError("Quantity exceeds available stock", 400);
    }

    item.quantity = newQuantity;
  } else {
    // ❌ تحقق للمنتج الجديد
    if (quantity > product.stock) {
      throw new AppError("Not enough stock available", 400);
    }

    cart.items.push({
      product: productId,
      quantity,
      price: product.price,
    });
  }

  // 💰 total
  cart.totalPrice = cart.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  await cart.save();

  return successResponse(res, "Product added to cart", cart);
});