const conn = require("../../mariadb").promise();
const { StatusCodes } = require("http-status-codes");
const { sqlError, serverError } = require("../utils/errorHandler");

/* 좋아요 추가 */
const likeBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { user_id: userId } = req.body; // 추후 로그인 기능해서 jwt생성해주면, 헤더에서 jwt꺼내서 user정보 뽑아내도록 수정할 예정

    let sql = "INSERT INTO likes(user_id, liked_book_id) VALUES(?,  ?);";
    let values = [userId, bookId];
    const [results] = await conn.query(sql, values);
    console.log(results);
    if (results.affectedRows > 0) {
      return res.status(StatusCodes.CREATED).json({ message: "좋아요 추가!" });
    }
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "잘못된 요청입니다. 확인 후 다시 시도해주세요." });
  } catch (err) {
    if (err.code && err.code.startsWith("ER_")) {
      sqlError(res, err);
    } else {
      serverError(res, err);
    }
  }
};

/* 좋아요 취소 */
const unlikeBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { user_id: userId } = req.body; // 추후 로그인 기능해서 jwt생성해주면, 헤더에서 jwt꺼내서 user정보 뽑아내도록 수정할 예정

    // let sql = "SELECT * FROM likes WHERE user_id=? AND bookId=?";
    let sql = "DELETE FROM likes WHERE user_id=? AND liked_book_id=?";
    let values = [userId, bookId];
    const [results] = await conn.query(sql, values);
    console.log(results);
    if (results.affectedRows > 0) {
      return res.status(StatusCodes.CREATED).json({ message: "좋아요 취소!" });
    }
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "잘못된 요청입니다. 확인 후 다시 시도해주세요." });
  } catch (err) {
    if (err.code && err.code.startsWith("ER_")) {
      sqlError(res, err);
    } else {
      serverError(res, err);
    }
  }
};

module.exports = { likeBook, unlikeBook };
