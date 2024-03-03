const conn = require("../../database/mariadb").promise();
const { snakeToCamelData } = require("../utils/convertSnakeToCamel");
const { CustomError, ERROR_MESSAGES } = require("../middlewares/errorHandlerMiddleware");

const RESPONSE_MESSAGES = {
  NO_BOOKS: "조회 가능한 도서가 없습니다.",
  NO_RECENTLY_PUBLISHED_BOOKS: "최신 도서가 없습니다.",
};

const getBooksInfoService = async (categoryId, isNew, page, limit) => {
  const baseSql = `SELECT b.*, c.category_name,
                    (SELECT count(*) FROM likes WHERE likes.liked_book_id=b.id) AS likes
                  FROM books AS b INNER JOIN categories AS c USING (category_id)`;
  const categorySql = "category_id=?";
  const isNewBookSql = "published_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND CURDATE()";
  const tailSql = " LIMIT ? OFFSET ?";

  let sql = `${baseSql} ${tailSql}`; // 전체 도서 목록 조회
  let totalBookSql = baseSql;
  let message = RESPONSE_MESSAGES.NO_BOOKS;
  const offset = (page - 1) * limit;
  let values = [limit, offset];
  let categoryName = "";

  if (categoryId) {
    const preSql = `SELECT * FROM categories WHERE category_id=?`;
    const [preResults] = await conn.query(preSql, [categoryId]);
    if (preResults.length === 0) {
      throw new CustomError(ERROR_MESSAGES.BAD_REQUEST);
    }
    categoryName = preResults[0].category_name;
    values = [categoryId, ...values];
  }

  if (categoryId && isNew) {
    // 카테고리 별 신간 도서 목록 조회 (출판일이 현재 일자 기준으로 30일 이내인 도서)
    totalBookSql = `${baseSql} WHERE ${categorySql} AND ${isNewBookSql}`;
    sql = `${totalBookSql} ${tailSql}`;
    message = `${categoryName} 카테고리에는 ${RESPONSE_MESSAGES.NO_RECENTLY_PUBLISHED_BOOKS}`;
  } else if (categoryId && !isNew) {
    // 카테고리 별 도서 목록 조회
    totalBookSql = `${baseSql} WHERE ${categorySql}`;
    sql = `${totalBookSql} ${tailSql}`;
    message = `${categoryName} 카테고리에는 ${RESPONSE_MESSAGES.NO_BOOKS}`;
  } else if (!categoryId && isNew) {
    // 신간 도서 목록 조회 (전체 카테고리 통합)
    totalBookSql = `${baseSql} WHERE ${isNewBookSql}`;
    sql = `${totalBookSql} ${tailSql}`;
    message = RESPONSE_MESSAGES.NO_RECENTLY_PUBLISHED_BOOKS;
  }

  const [totalBookResult] = await conn.query(totalBookSql, values);
  const totalBooks = totalBookResult.length;

  const [results] = await conn.query(sql, values);
  if (results.length > 0) {
    const books = snakeToCamelData(results);
    return { data: { books, pagination: { totalBooks, page } }, message: null };
  }

  if (page > 1) {
    // 조회 가능한 페이지 번호가 아닌 경우
    throw new CustomError(ERROR_MESSAGES.BAD_REQUEST);
  }

  return {
    data: { books: [], pagination: { totalBooks: 0, page: 1 } },
    message,
  };
};

const getBookDetailService = async (bookId, userId) => {
  // 로그인 하지 않은 유저가 개별 도서 조회 api를 호출한 경우
  let sql = `SELECT b.*, c.category_name,
              (SELECT COUNT(*) FROM likes WHERE liked_book_id = b.id) AS likes
            FROM books AS b INNER JOIN categories AS c USING (category_id) 
            WHERE b.id = ?`;
  let values = [bookId];

  if (userId) {
    // 로그인한 유저가 개별 도서 조회 api를 호출한 경우(accessToken 유효성 검증 과정이 선행됨)
    sql = `
      SELECT b.*, c.category_name,
        (SELECT COUNT(*) FROM likes WHERE liked_book_id = b.id) AS likes,
        EXISTS (SELECT 1 FROM likes WHERE user_id = ? AND liked_book_id = ?) AS is_liked 
      FROM books AS b INNER JOIN categories AS c USING (category_id) 
      WHERE b.id = ?`;
    values = [userId, bookId, bookId];
  }

  const [results] = await conn.query(sql, values);
  console.log(results);
  if (results.length > 0) {
    // let data = Object.fromEntries(Object.entries(results[0]));
    data = snakeToCamelData(results[0]);
    return { data };
  }
  throw new CustomError(ERROR_MESSAGES.BOOKS_NOT_FOUND);
};

module.exports = { getBooksInfoService, getBookDetailService };
