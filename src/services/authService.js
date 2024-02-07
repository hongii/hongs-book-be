const conn = require("../../database/mariadb").promise();
const { StatusCodes } = require("http-status-codes");
const { CustomError, ERROR_MESSAGES } = require("../middlewares/errorHandlerMiddleware");
const { createToken } = require("../utils/createToken");
const jwt = require("jsonwebtoken");
const privateKey = process.env.PRIVATE_KEY;

const refreshAccessTokenService = async (userId, refreshToken) => {
  let sql = "SELECT * FROM users WHERE id=? AND refresh_token=?";
  let values = [+userId, refreshToken];
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
  throw new CustomError(ERROR_MESSAGES.REFRESH_TOKEN_MISMATCH, StatusCodes.UNAUTHORIZED);
};

module.exports = { refreshAccessTokenService };
