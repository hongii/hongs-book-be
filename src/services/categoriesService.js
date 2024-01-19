const conn = require("../../database/mariadb").promise();
const { StatusCodes } = require("http-status-codes");
const { snakeToCamelData } = require("../utils/convertSnakeToCamel");
const { CustomError } = require("../middlewares/errorHandlerMiddleware");

const getAllCategoriesService = async () => {
  const sql = `SELECT * FROM categories`;
  const [results] = await conn.query(sql);
  if (results.length > 0) {
    const categories = snakeToCamelData(results);
    return { data: { categories } };
  }
  throw new CustomError("조회 가능한 도서가 없습니다.", StatusCodes.NOT_FOUND);
};

module.exports = { getAllCategoriesService };
