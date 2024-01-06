const conn = require("../../mariadb").promise();
const { StatusCodes } = require("http-status-codes");
const { sqlError, serverError } = require("../utils/errorHandler");

/* 도서 목록 조회 */
const getBooks = async (req, res) => {
  try {
    const { category_id, isNew } = req.query;

    if (category_id) {
      // 카테고리 별 도서 목록 조회
      const sql = "SELECT * FROM books WHERE category_id=?";
      const [results] = await conn.query(sql, category_id);
      if (results.length > 0) {
        return res.status(StatusCodes.OK).json(results[0]);
      }
      return res
        .status(StatusCodes.NO_CONTENT)
        .json({ message: "해당 카테고리에 해당하는 도서가 존재하지 않습니다." });
    } else {
      // 전체 도서 목록 조회
      const sql = "SELECT * FROM books";
      const [results] = await conn.query(sql);
      if (results.length > 0) {
        return res.status(StatusCodes.OK).json(results);
      }
      return res.status(StatusCodes.NOT_FOUND).json({ message: "도서 목록이 비어있습니다." });
    }
  } catch (err) {
    if (err.code && err.code.startsWith("ER_")) {
      sqlError(res, err);
    } else {
      serverError(res, err);
    }
  }
};

/* 개별 도서 조회 */
const getBookInfo = async (req, res) => {
  try {
    const { bookId } = req.params;

    const sql = `SELECT * 
      FROM books AS b INNER JOIN categories AS c USING (category_id) 
      WHERE b.id=?`;
    const [results] = await conn.query(sql, +bookId);
    if (results.length > 0) {
      const data = Object.fromEntries(
        Object.entries(results[0]).filter(([key]) => key !== "category_id"),
      );
      return res.status(StatusCodes.OK).json({ data });
    }
    return res.status(StatusCodes.NOT_FOUND).json({ message: "존재하지 않는 도서입니다." });
  } catch (err) {
    if (err.code && err.code.startsWith("ER_")) {
      sqlError(res, err);
    } else {
      serverError(res, err);
    }
  }
};

module.exports = { getBooks, getBookInfo };
