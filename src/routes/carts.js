const express = require("express");
const router = express.Router();

const {
  validateGetAddToCart,
  validateGetCartItems,
  validateRemoveFromCart,
} = require("../middlewares/validateMiddleware");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { addTocart, getCartItems, removeFromCart } = require("../controllers/cartsController");

router.use(authenticateToken);

router.post("/", validateGetAddToCart, addTocart);
router.get("/", validateGetCartItems, getCartItems);
router.delete("/:bookId", validateRemoveFromCart, removeFromCart);

module.exports = router;
