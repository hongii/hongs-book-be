const { StatusCodes } = require("http-status-codes");
const { asyncWrapper } = require("../middlewares/asyncWrapperMiddleware");
const {
  requestPaymentService,
  getOrderListService,
  getOrderListDetailsService,
} = require("../services/ordersService");

/* 주문(결제) 요청 */
const requestPayment = async (req, res) => {
  let { items, delivery, totalQuantity, totalPrice, mainBookTitle } = req.body;
  const { id: userId } = req.user;

  const { message } = await requestPaymentService(
    items,
    delivery,
    totalQuantity,
    totalPrice,
    mainBookTitle,
    userId,
  );
  return res.status(StatusCodes.OK).json({ message });
};

/* 전체 주문 내역 조회 */
const getOrderList = async (req, res) => {
  const { id: userId } = req.user;

  const { data } = await getOrderListService(userId);
  if (data) {
    return res.status(StatusCodes.OK).json({ data });
  }
  return res.status(StatusCodes.NO_CONTENT).json(); // 주문 내역 없는 경우
};

/* 주문 내역의 상품 상세 조회 */
const getOrderListDetails = async (req, res) => {
  const { orderId } = req.params;
  const { id: userId } = req.user;

  const { data } = await getOrderListDetailsService(orderId, userId);
  return res.status(StatusCodes.OK).json({ data });
};

module.exports = {
  requestPayment: asyncWrapper(requestPayment),
  getOrderList: asyncWrapper(getOrderList),
  getOrderListDetails: asyncWrapper(getOrderListDetails),
};
