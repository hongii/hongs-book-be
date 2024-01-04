const express = require("express");
const router = express.Router();
router.use(express.json());

/* 주문(결제) 요청 */
const requestPayment = (req, res) => {};

/* 주문 내역 조회 */
const getOrderLIst = (req, res) => {};

/* 주문 내역의 상세 상품 조회 */
const getOrderListDetails = (req, res) => {};

router.post("/", requestPayment);
router.get("/", getOrderLIst);
router.get("/:orderedId", getOrderListDetails);

module.exports = router;
