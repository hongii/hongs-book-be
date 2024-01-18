const conn = require("../../mariadb").promise();
const { StatusCodes } = require("http-status-codes");
const { asyncWrapper } = require("../middlewares/asyncWrapperMiddleware");
const { CustomError } = require("../middlewares/errorHandlerMiddleware");

const getlikesCnt = async (bookId) => {
  let sql = `SELECT (SELECT COUNT(*) FROM likes WHERE liked_book_id = b.id) AS likes
            FROM books AS b INNER JOIN categories AS c USING (category_id) 
            WHERE b.id = ?`;
  let [results] = await conn.query(sql, bookId);
  if (results.length > 0) {
    return results[0].likes;
  }
};

/* 좋아요 추가 OR 취소 */
const likeAndUnlikeBook = async (req, res) => {
  const { bookId } = req.params;
  const { id: userId } = req.user;

  let sql = "SELECT * FROM likes WHERE user_id=? AND liked_book_id=?";
  let values = [+userId, +bookId];
  let [results] = await conn.query(sql, values);
  if (results.length > 0) {
    // 이미 사용자가 해당 도서를 "좋아요" 해둔 경우 -> 좋아요 취소 진행(toggle)
    sql = "DELETE FROM likes WHERE user_id=? AND liked_book_id=?";
    values = [+userId, +bookId];
    [results] = await conn.query(sql, values);
    if (results.affectedRows > 0) {
      let likes = await getlikesCnt(+bookId);
      return res.status(StatusCodes.OK).json({ data: { likes }, message: "좋아요 취소!" });
    }
  } else {
    // 사용자가 해당 도서를 "좋아요" 해두지 않은 경우 -> 좋아요 추가
    sql = "INSERT INTO likes(user_id, liked_book_id) VALUES(?,  ?);";
    values = [+userId, +bookId];
    [results] = await conn.query(sql, values);
    if (results.affectedRows > 0) {
      let likes = await getlikesCnt(+bookId);
      return res.status(StatusCodes.CREATED).json({ data: { likes }, message: "좋아요 추가!" });
    }
  }

  throw new CustomError("잘못된 요청입니다. 확인 후 다시 시도해주세요.", StatusCodes.BAD_REQUEST);
};

module.exports = { likeAndUnlikeBook: asyncWrapper(likeAndUnlikeBook) };
