const { StatusCodes } = require("http-status-codes");
const { asyncWrapper } = require("../middlewares/asyncWrapperMiddleware");
const querystring = require("querystring");
const {
  aladinBookListAxios,
  aladinBookItemAxios,
  aladinSearchBooksAxios,
} = require("../api/aladinHttp");
const { likesCountService, isLikedService } = require("../services/likesService");

/* 도서 목록 조회 */
const getAladinBookList = async (req, res) => {
  const queryString = querystring.stringify(req.query);
  const response = await aladinBookListAxios.get(`?${queryString}`);
  const { totalResults, startIndex, item } = response.data;

  // console.log(response.data);
  return res.status(StatusCodes.OK).json({ item, totalResults, startIndex });
};

/* 개별 도서 조회 */
const getAladinBookItem = async (req, res) => {
  const userId = req.user?.id;
  const queryString = querystring.stringify(req.query);
  const response = await aladinBookItemAxios.get(`?${queryString}`);

  const params = new URLSearchParams(queryString);
  const bookId = params.get("ItemId");
  const { likes } = await likesCountService(bookId);
  const { isLiked } = await isLikedService(bookId, userId);

  const { item } = response.data;
  const data = { ...item, likes, isLiked };
  return res.status(StatusCodes.OK).json(data);
};

/* 도서 검색 조회 */
const getSearchAladinBooks = async (req, res) => {
  const queryString = querystring.stringify(req.query);
  const response = await aladinSearchBooksAxios.get(`?${queryString}`);

  const { totalResults, startIndex, item } = response.data;
  return res.status(StatusCodes.OK).json({ item, totalResults, startIndex });
};

module.exports = {
  getAladinBookList: asyncWrapper(getAladinBookList),
  getAladinBookItem: asyncWrapper(getAladinBookItem),
  getSearchAladinBooks: asyncWrapper(getSearchAladinBooks),
};
