const { StatusCodes } = require("http-status-codes");
const { asyncWrapper } = require("../middlewares/asyncWrapperMiddleware");
const {
  addTocartService,
  getCartItemsService,
  removeFromCartService,
} = require("../services/cartsService");

/* 장바구니에 담기 */
const addTocart = async (req, res) => {
  let { bookId, quantity } = req.body;
  const { id: userId } = req.user;

  const { message } = await addTocartService(bookId, quantity, userId);
  return res.status(StatusCodes.CREATED).json({ message });
};

/* 장바구니 목록 조회 */
const getCartItems = async (req, res) => {
  const { selected: cartItemIds } = req.body;
  const { id: userId } = req.user;

  const { data, message } = await getCartItemsService(cartItemIds, userId);
  return res.status(StatusCodes.OK).json({ data, message });
};

/* 장바구니에서 물품 제거 */
const removeFromCart = async (req, res) => {
  const { id: userId } = req.user;
  const { bookId } = req.params;

  await removeFromCartService(bookId, userId);
  return res.status(StatusCodes.NO_CONTENT).json();
};

module.exports = {
  addTocart: asyncWrapper(addTocart),
  getCartItems: asyncWrapper(getCartItems),
  removeFromCart: asyncWrapper(removeFromCart),
};
