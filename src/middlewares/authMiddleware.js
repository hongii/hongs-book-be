const { asyncWrapper } = require("../middlewares/asyncWrapperMiddleware");
const { CustomError } = require("../middlewares/errorHandlerMiddleware");
const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");
const privateKey = process.env.PRIVATE_KEY;

const authenticateToken = async (req, res, next) => {
  const { access_token: accessToken } = req.cookies;
  const endPoint = req.originalUrl.slice(0, req.originalUrl.length - 2);
  //const accessToken = req.headers.authorization && req.headers.authorization.split(" ")[1]; // 추후, 프론트단까지 구현완료되면 헤더에서 access token 값을 추출
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

  const { uid } = jwt.verify(accessToken, privateKey);
  if (uid) {
    req.user = { id: uid };
    return next();
  }
};

module.exports = { authenticateToken: asyncWrapper(authenticateToken) };