const express = require("express");
const router = express.Router();

const {
  validateGetAddToCart,
  validateGetCartItems,
  validateRemoveFromCart,
} = require("../middlewares/validateMiddleware");
const { authenticateToken, refreshAccessToken } = require("../middlewares/authMiddleware");
const { addTocart, getCartItems, removeFromCart } = require("../controllers/cartsController");

router.use(authenticateToken, refreshAccessToken);

router.post("/", validateGetAddToCart, addTocart);
router.get("/", validateGetCartItems, getCartItems);
router.delete("/books/:bookId", validateRemoveFromCart, removeFromCart);

module.exports = router;
