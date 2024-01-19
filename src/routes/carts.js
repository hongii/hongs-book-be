const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middlewares/authMiddleware");
const { addTocart, getCartItems, removeFromCart } = require("../controllers/cartsController");

router.use(authenticateToken);

router.post("/", addTocart);
router.get("/", getCartItems);
router.delete("/:bookId", removeFromCart);

module.exports = router;
