const express = require("express");
const router = express.Router();

const {
  requestPayment,
  getOrderList,
  getOrderListDetails,
} = require("../controllers/ordersController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.use(authenticateToken);

router.post("/", requestPayment);
router.get("/", getOrderList);
router.get("/:orderId", getOrderListDetails);

module.exports = router;
