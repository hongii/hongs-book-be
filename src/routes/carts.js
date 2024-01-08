const express = require("express");
const router = express.Router();
router.use(express.json());

const { addTocart, getCartItems, removeFromCart } = require("../controller/cartController");

router.post("/", addTocart);
router.get("/", getCartItems);
router.delete("/:bookId", removeFromCart);

module.exports = router;
