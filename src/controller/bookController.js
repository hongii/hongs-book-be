const conn = require("../../mariadb").promise();
const { StatusCodes } = require("http-status-codes");
const { sqlError, serverError } = require("../utils/errorHandler");

/* 도서 목록 조회 */
const getBooksInfo = async (req, res) => {
  try {
    // limit : 한 page당 보여줄 도서 갯수, page : 현재 페이지 번호
    // offset = (page - 1) * limit
    let { category_id: categoryId, new: isNew, page, limit } = req.query;

    // 아래 변수들의 default값은 전체 도서 목록 조회 기준
    limit = parseInt(limit);
    let offset = (+page - 1) * limit;
    let sql = `SELECT b.*, c.category_name, 
    (SELECT count(*) FROM likes WHERE likes.liked_book_id=b.id) AS likes 
    FROM books AS b INNER JOIN categories AS c USING (category_id)`,
      tailSql = " LIMIT ? OFFSET ?",
      errMessage = "조회 가능한 도서 목록이 비어 있습니다.",
      values = [limit, offset];

    if (categoryId) {
      let preSql = "SELECT category_name FROM categories WHERE category_id=?";
      const [results] = await conn.query(preSql, categoryId);

      if (results.length > 0) {
        let categoryName = results[0].category_name;
        if (isNew) {
          // 카테고리 별 신간 도서 목록 조회(출판일이 현재 일자 기준으로 30일 이내인 도서)
          sql = `${sql} WHERE category_id=? AND published_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND CURDATE()`;
          values = [+categoryId, ...values];
          errMessage =
            page > 1
              ? null
              : `${categoryName} 카테고리에는 지난 30일 이내에 출간된 새로운 도서가 없습니다.`;
        } else {
          // 카테고리 별 도서 목록 조회
          sql = `${sql} WHERE category_id=?`;
          values = [+categoryId, ...values];
          errMessage = page > 1 ? null : `${categoryName} 카테고리에 해당하는 도서가 없습니다.`;
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

    const [results] = await conn.query(sql + tailSql, values);
    if (results.length > 0) {
      const data = Object.entries(results)
        .filter(([key]) => key !== "category_id")
        .map((arr) => arr[1]);
      console.log(data);
      return res.status(StatusCodes.OK).json({ data });
    }

    if (errMessage) {
      // 요청한 조건에 부합하는 도서가 존재하지 않는 경우
      return res.status(StatusCodes.NOT_FOUND).json({ message: errMessage });
    }
    // 해당 페이지에서 조회된 도서 목록이 없는 경우(바로 직전 페이지가 마지막 페이지라는 뜻)
    return res.status(StatusCodes.NO_CONTENT).json();
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
    const { user_id: userId } = req.body;

    const sql = `
      SELECT b.*, c.category_name,
        (SELECT COUNT(*) FROM likes WHERE liked_book_id = b.id) AS likes,
        EXISTS (SELECT 1 FROM likes WHERE user_id = ? AND liked_book_id = ?) AS is_liked 
      FROM books AS b INNER JOIN categories AS c USING (category_id) 
      WHERE b.id = ?`;
    const values = [+userId, +bookId, +bookId];
    const [results] = await conn.query(sql, values);
    if (results.length > 0) {
      const data = Object.fromEntries(
        Object.entries(results[0]).filter(([key]) => key !== "category_id"),
      );
      return res.status(StatusCodes.OK).json({ data }); // 카테고리 id 정보도 함께 보내려면 { data: results } 이렇게 보내주면 됨
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
