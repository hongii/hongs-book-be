const express = require("express");
const router = express.Router();
router.use(express.json());

const {
  requestPayment,
  getOrderList,
  getOrderListDetails,
} = require("../controller/orderController");

router.post("/", requestPayment);
router.get("/", getOrderList);
router.get("/:orderId", getOrderListDetails);

module.exports = router;
