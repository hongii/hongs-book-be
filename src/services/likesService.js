const conn = require("../../database/mariadb").promise();
const { CustomError } = require("../middlewares/errorHandlerMiddleware");
const { camelToSnakeData } = require("../utils/convert");

const RESPONSE_MESSAGES = {
  LIKED: "liked",
  UNLIKED: "unliked",
};

const insertBookInfoService = async (bookId, info) => {
  const isExistedBookInfoSql = "SELECT COUNT(*) AS count FROM aladin_books WHERE item_id=?";
  let [results] = await conn.query(isExistedBookInfoSql, [bookId]);
  if (results[0].count === 0) {
    const insertBookSql =
      "INSERT INTO aladin_books (item_id, title, category_id, description, author, price_standard, pub_date, cover, form, isbn13, publisher, item_page, rating_score, rating_count, my_review_count, best_seller_rank) VALUES ?";
    const bookInfo = camelToSnakeData(info);
    const values = [
      [
        bookInfo.item_id,
        bookInfo.title,
        bookInfo.category_id,
        bookInfo.description,
        bookInfo.author,
        bookInfo.price_standard,
        bookInfo.pub_date,
        bookInfo.cover,
        bookInfo.form,
        bookInfo.isbn13,
        bookInfo.publisher,
        bookInfo.item_page,
        bookInfo.rating_score,
        bookInfo.rating_count,
        bookInfo.my_review_count,
        bookInfo.best_seller_rank,
      ],
    ];
    await conn.query(insertBookSql, [values]);
  }
};

const likeAndUnlikeBookService = async (bookId, userId) => {
  const checkLikeSql = "SELECT * FROM likes WHERE user_id=? AND liked_book_id=?";
  const unLikeSql = "DELETE FROM likes WHERE user_id=? AND liked_book_id=?";
  const addLikeSql = "INSERT INTO likes(user_id, liked_book_id) VALUES(?, ?)";
  const countLikesSql = "SELECT COUNT(*) AS likes FROM likes WHERE liked_book_id = ?";

  let [results] = await conn.query(checkLikeSql, [userId, bookId]);

  if (results.length > 0) {
    // 이미 사용자가 해당 도서를 "좋아요" 해둔 경우 -> 좋아요 취소 진행(toggle)
    [results] = await conn.query(unLikeSql, [userId, bookId]);
    if (results.affectedRows === 1) {
      [results] = await conn.query(countLikesSql, bookId);
      const likes = results[0].likes;
      return { data: { likes }, message: RESPONSE_MESSAGES.UNLIKED };
    }
  } else {
    // 사용자가 해당 도서를 "좋아요" 해두지 않은 경우 -> 좋아요 추가
    [results] = await conn.query(addLikeSql, [userId, bookId]);
    if (results.affectedRows === 1) {
      [results] = await conn.query(countLikesSql, bookId);
      const likes = results[0].likes;
      return { data: { likes }, message: RESPONSE_MESSAGES.LIKED };
    }
  }
  throw new CustomError(ERROR_MESSAGES.BAD_REQUEST);
};

const likesCountService = async (bookId) => {
  const likeCountSql = "SELECT COUNT(*) AS likes FROM likes WHERE liked_book_id=?";
  let [results] = await conn.query(likeCountSql, [bookId]);
  return { likes: results[0].likes };
};

const isLikedService = async (bookId, userId) => {
  if (userId) {
    // 로그인한 유저가 개별 도서 조회 api를 호출한 경우(accessToken 유효성 검증 과정이 선행됨)
    const sql = `SELECT EXISTS (SELECT 1 FROM likes WHERE user_id = ? AND liked_book_id = ?) AS is_liked`;
    const [results] = await conn.query(sql, [userId, bookId]);
    if (results.length > 0) {
      return { isLiked: results[0].is_liked };
    }
  } else return { isLiked: false };

  throw new CustomError(ERROR_MESSAGES.BOOKS_NOT_FOUND);
};

module.exports = {
  likeAndUnlikeBookService,
  insertBookInfoService,
  likesCountService,
  isLikedService,
};
