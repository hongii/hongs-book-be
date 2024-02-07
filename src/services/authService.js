const conn = require("../../database/mariadb").promise();
const { StatusCodes } = require("http-status-codes");
const { CustomError, ERROR_MESSAGES } = require("../middlewares/errorHandlerMiddleware");
const { createToken } = require("../utils/createToken");
const jwt = require("jsonwebtoken");
const privateKey = process.env.PRIVATE_KEY;

const refreshAccessTokenService = async (userId, refreshToken) => {
  let sql = "SELECT * FROM users WHERE id=? AND refresh_token=?";
  let values = [userId, refreshToken];
  let [results] = await conn.query(sql, values);
  if (results.length > 0) {
    jwt.verify(refreshToken, privateKey);

    const targetUser = results[0];
    const newAccessToken = createToken("accessToken", targetUser);
    const newRefreshToken = createToken("refreshToken", targetUser);

    sql = "UPDATE users SET refresh_token=? WHERE id=?";
    values = [newRefreshToken, targetUser.id];
    [results] = await conn.query(sql, values);

    if (results.affectedRows === 1) {
      return { newAccessToken, newRefreshToken };
    }
  }

  // db에 저장되어 있는 사용자의 Refresh Token과 cookie에 담겨진 Refresh Token이 일치하지 않는 경우
  // => 토큰 탈취나 변조와 같은 보안상 문제라고 간주하고 db에 저장된 Refresh Token을 초기화시키고 재로그인 유도
  const isResetRefreshToken = await resetRefreshToken(userId);
  if (isResetRefreshToken) {
    // db에 저장된 Refresh Token을 초기화 성공한 경우
    throw new CustomError(ERROR_MESSAGES.REFRESH_TOKEN_MISMATCH, StatusCodes.UNAUTHORIZED);
  }
  // db에 저장된 Refresh Token 초기화 실패한 경우
  throw new CustomError(ERROR_MESSAGES.REFRESH_TOKEN_RESET_FAILED, StatusCodes.UNAUTHORIZED);
};

/* DB에 저장된 해당 사용자의 Refresh Token 초기화 */
const resetRefreshToken = async (userId) => {
  const sql = `UPDATE users SET refresh_token=? WHERE id=?`;
  const values = ["", userId];
  const [results] = await conn.query(sql, values);
  return results.affectedRows === 1 ? true : false;
};

module.exports = { refreshAccessTokenService, resetRefreshToken };
