const { asyncWrapper } = require("../middlewares/asyncWrapperMiddleware");
const { CustomError, ERROR_MESSAGES } = require("../middlewares/errorHandlerMiddleware");
const { StatusCodes } = require("http-status-codes");
const conn = require("../../database/mariadb").promise();
const jwt = require("jsonwebtoken");
const { createToken } = require("../utils/createToken");
const privateKey = process.env.PRIVATE_KEY;

const authenticateToken = async (req, res, next) => {
  const endPoint = req.originalUrl.slice(0, req.originalUrl.length - 2);
  const accessToken = req.headers.authorization?.split(" ")[1];
  if (!accessToken) {
    if (endPoint === "/api/books") {
      return next();
    } else {
      throw new CustomError(ERROR_MESSAGES.LOGIN_REQUIRED, StatusCodes.UNAUTHORIZED);
    }
  }

  try {
    const { uid } = jwt.verify(accessToken, privateKey);
    req.user = { id: uid };
    req.expired = false;
    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      console.log("Access token expired.");
      const { uid } = jwt.decode(accessToken);
      req.user = { id: uid };
      req.expired = true;
      return next();
    }
    next(err);
  }
};

const refreshAccessToken = async (req, res, next) => {
  const endPoint = req.originalUrl;
  const expired = req.expired;
  if (!expired) {
    return next();
  } else if (endPoint === "/api/users/logout") {
    return next(); // logout시에는 굳이 만료된 토큰을 재발급 받을 필요 없지 않을까
  }

  const { refresh_token: refreshToken } = req.cookies;
  if (!refreshToken) {
    throw new CustomError(ERROR_MESSAGES.TOKEN_EXPIRED, StatusCodes.UNAUTHORIZED);
  }

  const { id: userId } = req.user;
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
      res.cookie("refresh_token", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
        maxAge: 1000 * 60 * 60 * 24 * 14, // 14일
      });

      res.header("Authorization", `Bearer ${newAccessToken}`);
      console.log("Access token refreshed.");
      return next();
    }
  }
  throw new CustomError(ERROR_MESSAGES.REFRESH_TOKEN_MISMATCH, StatusCodes.UNAUTHORIZED);
};

module.exports = {
  authenticateToken: asyncWrapper(authenticateToken),
  refreshAccessToken: asyncWrapper(refreshAccessToken),
};
