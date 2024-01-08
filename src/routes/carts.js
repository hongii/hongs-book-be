const express = require("express");
const router = express.Router();
router.use(express.json());

const {
  addTocart,
  getCartItems,
  removeFromCart,
  getselectedItem,
} = require("../controller/cartController");

router.post("/", addTocart);
router.get("/", getCartItems);
router.delete("/:bookId", removeFromCart);
router.get("/items", getselectedItem);

module.exports = router;
