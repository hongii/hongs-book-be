const express = require("express");
const router = express.Router();

const {
  validateRequestPayment,
  validateGetOrderListDetails,
} = require("../middlewares/validateMiddleware");
const {
  requestPayment,
  getOrderList,
  getOrderListDetails,
} = require("../controllers/ordersController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.use(authenticateToken);

router.post("/", validateRequestPayment, requestPayment);
router.get("/", getOrderList);
router.get("/:orderId", validateGetOrderListDetails, getOrderListDetails);

module.exports = router;
