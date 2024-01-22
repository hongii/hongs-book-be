const express = require("express");
const router = express.Router();

const { authenticateToken, refreshAccessToken } = require("../middlewares/authMiddleware");
const {
  validateRequestPayment,
  validateGetOrderListDetails,
} = require("../middlewares/validateMiddleware");
const {
  requestPayment,
  getOrderList,
  getOrderListDetails,
} = require("../controllers/ordersController");

router.use(authenticateToken, refreshAccessToken);

router.post("/", validateRequestPayment, requestPayment);
router.get("/", getOrderList);
router.get("/:orderId", validateGetOrderListDetails, getOrderListDetails);

module.exports = router;
