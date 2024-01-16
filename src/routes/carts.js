const express = require("express");
const router = express.Router();
router.use(express.json());

const authenticateToken = require("../middleware/auth");
const { addTocart, getCartItems, removeFromCart } = require("../controller/cartController");

router.post("/", authenticateToken, addTocart);
router.get("/", authenticateToken, getCartItems);
router.delete("/:bookId", authenticateToken, removeFromCart);

module.exports = router;
