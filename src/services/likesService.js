const conn = require("../../database/mariadb").promise();
const { StatusCodes } = require("http-status-codes");
const { CustomError } = require("../middlewares/errorHandlerMiddleware");

const RESPONSE_MESSAGES = {
  LIKED: "좋아요 추가!",
  UNLIKED: "좋아요 취소!",
};

const likeAndUnlikeBookService = async (bookId, userId) => {
  let sql = "SELECT * FROM likes WHERE user_id=? AND liked_book_id=?";
  let values = [+userId, +bookId];
  let [results] = await conn.query(sql, values);
  if (results.length > 0) {
    // 이미 사용자가 해당 도서를 "좋아요" 해둔 경우 -> 좋아요 취소 진행(toggle)
    sql = "DELETE FROM likes WHERE user_id=? AND liked_book_id=?";
    values = [+userId, +bookId];
    [results] = await conn.query(sql, values);
    if (results.affectedRows === 1) {
      sql = `SELECT COUNT(*) AS likes FROM likes WHERE liked_book_id = ?`;
      const [getLikesResults] = await conn.query(sql, +bookId);
      let likes = getLikesResults[0].likes;
      return { data: { likes }, message: RESPONSE_MESSAGES.UNLIKED };
    }
  } else {
    // 사용자가 해당 도서를 "좋아요" 해두지 않은 경우 -> 좋아요 추가
    sql = "INSERT INTO likes(user_id, liked_book_id) VALUES(?,  ?);";
    values = [+userId, +bookId];
    [results] = await conn.query(sql, values);
    if (results.affectedRows === 1) {
      sql = `SELECT COUNT(*) AS likes FROM likes WHERE liked_book_id = ?`;
      const [getLikesResults] = await conn.query(sql, +bookId);
      let likes = getLikesResults[0].likes;
      return { data: { likes }, message: RESPONSE_MESSAGES.LIKED };
    }
  }

  throw new CustomError(ERROR_MESSAGES.BAD_REQUEST, StatusCodes.BAD_REQUEST);
};

module.exports = { likeAndUnlikeBookService };
