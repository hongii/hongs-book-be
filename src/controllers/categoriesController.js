const conn = require("../../mariadb").promise();
const { StatusCodes } = require("http-status-codes");
const { asyncWrapper } = require("../middlewares/asyncWrapperMiddleware");
const { CustomError } = require("../middlewares/errorHandlerMiddleware");
const { snakeToCamelData } = require("../utils/convertSnakeToCamel");

/* 카테고리 전체 목록 조회 */
const getAllCategories = async (req, res) => {
  const sql = "SELECT * FROM categories";
  const [results] = await conn.query(sql);
  if (results.length > 0) {
    const categories = snakeToCamelData(results);
    return res.status(StatusCodes.OK).json({ data: { categories } });
  }
  throw new CustomError("조회 가능한 도서가 없습니다.", StatusCodes.NOT_FOUND);
};

module.exports = { getAllCategories: asyncWrapper(getAllCategories) };
