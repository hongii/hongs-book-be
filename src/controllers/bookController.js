const conn = require("../../mariadb").promise();
const { StatusCodes } = require("http-status-codes");
const { snakeToCamelData } = require("../utils/convertSnakeToCamel");
const { asyncWrapper } = require("../middlewares/asyncWrapperMiddleware");
const { CustomError } = require("../middlewares/errorHandlerMiddleware");

/* 도서 목록 조회 */
const getBooksInfo = async (req, res) => {
  let { category_id: categoryId, new: isNew, page, limit } = req.query;

  // 아래 변수들의 default값은 전체 도서 목록 조회 기준
  limit = parseInt(limit);
  let offset = (+page - 1) * limit;
  let sql = `SELECT b.*, c.category_name,
                (SELECT count(*) FROM likes WHERE likes.liked_book_id=b.id) AS likes,
                (SELECT count(*) FROM books) AS total_books
              FROM books AS b INNER JOIN categories AS c USING (category_id)`,
    tailSql = " LIMIT ? OFFSET ?",
    errMessage = "조회 가능한 도서 목록이 비어 있습니다.",
    values = [limit, offset];

  if (categoryId) {
    let preSql = "SELECT category_name FROM categories WHERE category_id=?";
    const [results] = await conn.query(preSql, categoryId);

    if (results.length > 0) {
      let categoryName = results[0].category_name;
      values = [+categoryId, ...values];
      if (isNew) {
        // 카테고리 별 신간 도서 목록 조회(출판일이 현재 일자 기준으로 30일 이내인 도서)
        sql = `${sql} WHERE category_id=? AND published_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND CURDATE()`;
        errMessage =
          page > 1
            ? null
            : `${categoryName} 카테고리에는 지난 30일 이내에 출간된 새로운 도서가 없습니다.`;
      } else {
        // 카테고리 별 도서 목록 조회
        sql = `${sql} WHERE category_id=?`;
        errMessage = page > 1 ? null : `${categoryName} 카테고리에 해당하는 도서가 없습니다.`;
      }
    } else {
      // 존재하지 않는 카테고리id로 요청 들어온 경우
      throw new CustomError(
        "잘못된 요청입니다. 확인 후 다시 시도해주세요.",
        StatusCodes.BAD_REQUEST,
      );
    }
  } else if (!categoryId && isNew) {
    // 신간 도서 목록 조회 (전체 카테고리 통합)
    sql = `${sql} WHERE published_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND CURDATE()`;
    errMessage = "30일 이내에 출간된 신간 도서가 없습니다.";
  }

  const [results] = await conn.query(sql + tailSql, values);
  if (results.length > 0) {
    const totalBooks = results[0].total_books;
    let books = Object.entries(results)
      .filter(([key]) => key !== "category_id")
      .map((arr) => arr[1]);
    books = snakeToCamelData(books);
    return res.status(StatusCodes.OK).json({ data: { books, pagination: { totalBooks, page } } });
  }

  if (errMessage) {
    // 요청한 조건에 부합하는 도서가 존재하지 않는 경우
    throw new CustomError(errMessage, StatusCodes.NOT_FOUND);
  }
  // 해당 페이지에서 조회된 도서 목록이 없는 경우(바로 직전 페이지가 마지막 페이지라는 뜻)
  throw new CustomError("존재하지 않는 페이지입니다.", StatusCodes.NOT_FOUND);
};

/* 개별 도서 조회 */
const getBookDetail = async (req, res) => {
  const { bookId } = req.params;
  const userId = req.user?.id;

  // 로그인 하지 않은 유저가 개별 도서 조회 api를 호출한 경우
  let sql = `SELECT b.*, c.category_name,
        (SELECT COUNT(*) FROM likes WHERE liked_book_id = b.id) AS likes
      FROM books AS b INNER JOIN categories AS c USING (category_id) 
      WHERE b.id = ?`;
  let values = [+bookId];

  if (userId) {
    // 로그인한 유저가 개별 도서 조회 api를 호출한 경우(accessToken 유효성 검증 과정이 선행됨)
    sql = `
      SELECT b.*, c.category_name,
        (SELECT COUNT(*) FROM likes WHERE liked_book_id = b.id) AS likes,
        EXISTS (SELECT 1 FROM likes WHERE user_id = ? AND liked_book_id = ?) AS is_liked 
      FROM books AS b INNER JOIN categories AS c USING (category_id) 
      WHERE b.id = ?`;
    values = [+userId, +bookId, +bookId];
  }

  const [results] = await conn.query(sql, values);
  if (results.length > 0) {
    let data = Object.fromEntries(
      Object.entries(results[0]).filter(([key]) => key !== "category_id"),
    );
    data = snakeToCamelData(data);
    return res.status(StatusCodes.OK).json({ data }); // 카테고리 id 정보도 함께 보내려면 { data: results } 이렇게 보내주면 됨
  }
  throw new CustomError("존재하지 않는 도서입니다.", StatusCodes.NOT_FOUND);
};

module.exports = {
  getBooksInfo: asyncWrapper(getBooksInfo),
  getBookDetail: asyncWrapper(getBookDetail),
};