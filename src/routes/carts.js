const express = require("express");
const router = express.Router();
router.use(express.json());

/* 장바구니에 담기 */
const addTocart = (req, res) => {};

/* 장바구니 물품 조회 */
const getCartItems = (req, res) => {};

/* 장바구니에서 물품 제거 */
const removeFromCart = (req, res) => {};

/* 장바구니에서 선택한 물품 목록(주문 예상 물품 목록) 조회 */
const getselectedItem = (req, res) => {};

router.get("/", addTocart);
router.post("/", getCartItems);
router.delete("/:bookId", removeFromCart);
router.get("/items", getselectedItem);

module.exports = router;
