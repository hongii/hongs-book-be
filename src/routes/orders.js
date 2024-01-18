const express = require("express");
const router = express.Router();

const {
  requestPayment,
  getOrderList,
  getOrderListDetails,
} = require("../controllers/orderController");
const authenticateToken = require("../middlewares/auth");

router.post("/", authenticateToken, requestPayment);
router.get("/", authenticateToken, getOrderList);
router.get("/:orderId", authenticateToken, getOrderListDetails);

module.exports = router;
