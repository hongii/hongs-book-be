const { StatusCodes } = require("http-status-codes");
const { asyncWrapper } = require("../middlewares/asyncWrapperMiddleware");
const { getBooksInfoService, getBookDetailService } = require("../services/booksService");

/* 도서 목록 조회 */
const getBooksInfo = async (req, res) => {
  let { category_id: categoryId, new: isNew, page, limit } = req.query;

  const { data } = await getBooksInfoService(categoryId, isNew, page, limit);
  return res.status(StatusCodes.OK).json({ data });
};

/* 개별 도서 조회 */
const getBookDetail = async (req, res) => {
  const { bookId } = req.params;
  const userId = req.user?.id;

  const { data } = await getBookDetailService(bookId, userId);
  return res.status(StatusCodes.OK).json({ data });
};

module.exports = {
  getBooksInfo: asyncWrapper(getBooksInfo),
  getBookDetail: asyncWrapper(getBookDetail),
};
