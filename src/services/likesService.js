const conn = require("../../database/mariadb").promise();
const { CustomError } = require("../middlewares/errorHandlerMiddleware");

const RESPONSE_MESSAGES = {
  LIKED: "좋아요 추가!",
  UNLIKED: "좋아요 취소!",
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

module.exports = { likeAndUnlikeBookService };
