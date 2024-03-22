const { StatusCodes } = require("http-status-codes");
const { asyncWrapper } = require("../middlewares/asyncWrapperMiddleware");
const { likeAndUnlikeBookService, insertBookInfoService } = require("../services/likesService");

const RESPONSE_MESSAGES = {
  LIKED: "좋아요 추가!",
  UNLIKED: "좋아요 취소!",
};

/* 좋아요 추가 OR 취소 */
const likeAndUnlikeBook = async (req, res) => {
  const { bookId } = req.params;
  const { id: userId } = req.user;
  const info = req.body;

  await insertBookInfoService(+bookId, info);
  const { data, message } = await likeAndUnlikeBookService(+bookId, userId);

  if (message === RESPONSE_MESSAGES.LIKED) {
    return res.status(StatusCodes.CREATED).json({ data, message });
  }
  return res.status(StatusCodes.OK).json({ ...data, message });
};

module.exports = { likeAndUnlikeBook: asyncWrapper(likeAndUnlikeBook) };
