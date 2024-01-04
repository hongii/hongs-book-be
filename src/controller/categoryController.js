const conn = require("../../mariadb").promise();
const { StatusCodes } = require("http-status-codes");
const { sqlError, serverError } = require("../utils/errorHandler");

/* 카테고리 전체 목록 조회 */
const getAllCategories = async (req, res) => {
  try {
    const sql = "SELECT * FROM categories";
    const [results] = await conn.query(sql);
    if (results.length > 0) {
      return res.status(StatusCodes.OK).json(results);
    }
    return res.status(StatusCodes.NO_CONTENT).json({ message: "도서 목록이 비어있습니다." });
  } catch (err) {
    if (err.code && err.code.startsWith("ER_")) {
      sqlError(res, err);
    } else {
      serverError(res, err);
    }
  }
};

module.exports = getAllCategories;
