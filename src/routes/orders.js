const express = require("express");
const router = express.Router();

const {
  requestPayment,
  getOrderList,
  getOrderListDetails,
} = require("../controller/orderController");
const authenticateToken = require("../middleware/auth");

router.post("/", authenticateToken, requestPayment);
router.get("/", authenticateToken, getOrderList);
router.get("/:orderId", authenticateToken, getOrderListDetails);

module.exports = router;
