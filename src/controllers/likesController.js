const { StatusCodes } = require("http-status-codes");
const { asyncWrapper } = require("../middlewares/asyncWrapperMiddleware");
const { likeAndUnlikeBookService } = require("../services/likesService");

/* 좋아요 추가 OR 취소 */
const likeAndUnlikeBook = async (req, res) => {
  const { bookId } = req.params;
  const { id: userId } = req.user;

  const { data, message } = await likeAndUnlikeBookService(bookId, userId);
  return res.status(StatusCodes.CREATED).json({ data, message });
};

module.exports = { likeAndUnlikeBook: asyncWrapper(likeAndUnlikeBook) };
