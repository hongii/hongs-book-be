const conn = require("../../mariadb").promise();
const { StatusCodes } = require("http-status-codes");
const { sqlError, serverError } = require("../utils/errorHandler");

/* 도서 목록 조회 */
const getBooksInfo = async (req, res) => {
  try {
    const { category_id: categoryId, new: isNew } = req.query;
    // 아래 변수들의 default값은 전체 도서 목록 조회 기준
    let sql = "SELECT * FROM books",
      errMessage = "조회 가능한 도서 목록이 비어 있습니다.",
      values = null;

    if (categoryId) {
      let preSql = "SELECT category_name FROM categories WHERE category_id=?";
      const [results] = await conn.query(preSql, categoryId);

      if (results.length > 0) {
        let categoryName = results[0].category_name;
        if (isNew) {
          // 카테고리 별 신간 도서 목록 조회(출판일이 현재 일자 기준으로 30일 이내인 도서)
          sql = `${sql} WHERE category_id=? AND published_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND CURDATE()`;
          values = categoryId;
          errMessage = `${categoryName} 카테고리에는 지난 30일 이내에 출간된 새로운 도서가 없습니다.`;
        } else {
          // 카테고리 별 도서 목록 조회
          sql = `${sql} WHERE category_id=?`;
          console.log(sql);
          values = categoryId;
          errMessage = `${categoryName} 카테고리에 해당하는 도서가 없습니다.`;
        }
      } else {
        // 존재하지 않는 카테고리id로 요청 들어온 경우
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "잘못된 요청입니다. 확인 후 다시 시도해주세요." });
      }
    } else if (!categoryId && isNew) {
      // 신간 도서 목록 조회 (전체 카테고리 통합)
      sql = `${sql} WHERE published_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND CURDATE()`;
      errMessage = "30일 이내에 출간된 신간 도서가 없습니다.";
    }

    const [results] = await conn.query(sql, values);
    if (results.length > 0) {
      return res.status(StatusCodes.OK).json({ data: results });
    }

    return res.status(StatusCodes.NOT_FOUND).json({ message: errMessage });
  } catch (err) {
    if (err.code && err.code.startsWith("ER_")) {
      sqlError(res, err);
    } else {
      serverError(res, err);
    }
  }
};

/* 개별 도서 조회 */
const getBookDetail = async (req, res) => {
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

module.exports = { getBooksInfo, getBookDetail };
