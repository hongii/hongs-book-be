const { StatusCodes } = require("http-status-codes");
const { asyncWrapper } = require("../middlewares/asyncWrapperMiddleware");
const querystring = require("querystring");
const { aladinBookListAxios, aladinBookItemAxios } = require("../api/aladinHttp");

/* 도서 목록 조회 */
const getAladinBookList = async (req, res) => {
  const queryString = querystring.stringify(req.query);
  const url = `${process.env.ALADIN_BASE_URL}?${queryString}`;
  const response = await aladinBookListAxios.get(url);
  const { item } = response.data;

  return res.status(StatusCodes.OK).json(item);
};

/* 개별 도서 조회 */
const getAladinBookItem = async (req, res) => {
  const queryString = querystring.stringify(req.query);
  const url = `${process.env.ALADIN_BASE_URL}?${queryString}`;
  const response = await aladinBookItemAxios.get(url);
  const { item } = response.data;

  return res.status(StatusCodes.OK).json(item);
};

module.exports = {
  getAladinBookList: asyncWrapper(getAladinBookList),
  getAladinBookItem: asyncWrapper(getAladinBookItem),
};
