const { asyncWrapper } = require("../middlewares/asyncWrapperMiddleware");
const { CustomError } = require("../middlewares/errorHandlerMiddleware");
const { StatusCodes } = require("http-status-codes");
const conn = require("../../database/mariadb").promise();
const jwt = require("jsonwebtoken");
const privateKey = process.env.PRIVATE_KEY;

const authenticateToken = async (req, res, next) => {
  const endPoint = req.originalUrl.slice(0, req.originalUrl.length - 2);
  const accessToken = req.headers.authorization && req.headers.authorization.split(" ")[1]; // 추후, 프론트단까지 구현완료되면 헤더에서 access token 값을 추출
  if (!accessToken) {
    if (endPoint === "/api/books") {
      // 개별 도서 조회 api에서 로그인하지 않는 사용자가 요청 보낸 경우에는 유효성 검증 pass시킴
      /* 개별 도서 조회 api에서 로그인한 유저일 경우, 해당 도서를 좋아요 눌렀는지 여부(is_liked)를 sql쿼리 결과로 받아오고,
        로그인하지 않은 유저일 경우, 해당 도서를 좋아요 눌렀는지 여부(is_liked)를 그냥 false로 설정함 */
      return next();
    } else {
      throw new CustomError(
        "로그인이 필요합니다. 로그인 후 이용해주세요.",
        StatusCodes.UNAUTHORIZED,
      );
    }
  }

  try {
    const { uid } = jwt.verify(accessToken, privateKey);
    req.user = { id: uid };
    req.expired = false;
    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      const { uid } = jwt.decode(accessToken);
      req.user = { id: uid };
      req.expired = true;
      return next();
    }
    next(err);
  }
};

const refreshAccessToken = async (req, res, next) => {
  const expired = req.expired;
  if (!expired) {
    return next();
  }

  const { refresh_token: refreshToken } = req.cookies;
  if (!refreshToken) {
    throw new CustomError(
      "로그인(인증) 토큰이 만료되었습니다. 다시 로그인 후 사용해주세요.",
      StatusCodes.UNAUTHORIZED,
    );
  }

  const { id: userId } = req.user;
  let sql = "SELECT * FROM users WHERE id=? AND refresh_token=?";
  let values = [userId, refreshToken];
  let [results] = await conn.query(sql, values);
  if (results.length > 0) {
    jwt.verify(refreshToken, privateKey);

    const targetUser = results[0];
    let newAccessToken = jwt.sign({ email: targetUser.email, uid: targetUser.id }, privateKey, {
      expiresIn: process.env.ACCESSTOKEN_LIFETIME,
      issuer: process.env.ACCESSTOKEN_ISSUER,
    });

    let newRefreshToken = jwt.sign({ uid: targetUser.id }, privateKey, {
      expiresIn: process.env.REFRESHTOKEN_LIFETIME,
      issuer: process.env.REFRESHTOKEN_ISSUER,
    });

    sql = "UPDATE users SET refresh_token=? WHERE id=?";
    values = [newRefreshToken, targetUser.id];
    [results] = await conn.query(sql, values);

    if (results.affectedRows > 0) {
      res.cookie("refresh_token", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });

      /* 프론트 측에서는 서버로부터 받는 응답에서 매번 Authorization헤더를 확인해야한다. 
      만약 Authorization헤더에 값이 없다면 기존의 accesstoken이 유효하다고 판단하면 되고 
      Authorization헤더에 값이 있다면, 서버측에서 기존 accesstoken이 만료되어 새롭게 발급해준 access token이라고 간주하고 
      private변수에 새롭게 발급받은 access token을 다시 저장하면 된다.*/
      res.header("Authorization", `Bearer ${newAccessToken}`);
      return next();
    }
  }
  throw new CustomError(
    "refresh token정보가 일치하지 않습니다. 다시 로그인 후 사용해주세요.",
    StatusCodes.FORBIDDEN,
  );
  // 프론트에서는 401 또는 403 응답을 받으면 로그인 페이지로 이동 시키기(재로그인)
};

module.exports = {
  authenticateToken: asyncWrapper(authenticateToken),
  refreshAccessToken: asyncWrapper(refreshAccessToken),
};
