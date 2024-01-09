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
router.get("/:orderedId", getOrderListDetails);

module.exports = router;
