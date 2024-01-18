const express = require("express");
const router = express.Router();

const authenticateToken = require("../middlewares/auth");
const { addTocart, getCartItems, removeFromCart } = require("../controllers/cartController");

router.post("/", authenticateToken, addTocart);
router.get("/", authenticateToken, getCartItems);
router.delete("/:bookId", authenticateToken, removeFromCart);

module.exports = router;
