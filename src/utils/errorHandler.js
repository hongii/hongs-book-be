const { StatusCodes } = require("http-status-codes");

const serverError = (res, err) => {
  console.error(res, err);
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: "서버 오류가 발생했습니다. 잠시 후에 다시 시도해주세요.",
  });
};

const sqlError = (res, err) => {
  console.error(err);
  return res
    .status(StatusCodes.BAD_REQUEST)
    .json({
      message: "잘못된 정보를 입력하였습니다. 확인 후 다시 입력해주세요.",
    })
    .end();
};

const jwtError = (res, err) => {
  if (err.name === "TokenExpiredError") {
    // 만료된 토큰 에러 처리
    console.error("expired token");
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "로그인 인증이 만료되었습니다. 다시 로그인 후 사용해주세요." });
  } else if (err.name === "JsonWebTokenError") {
    // 유효하지 않은 토큰 에러 처리
    console.error("invalid token");
    return res.status(StatusCodes.FORBIDDEN).json({ message: "유효하지 않은 토큰입니다." });
  } else {
    // 그 외의 에러 처리
    console.error("Unexpected error:", err.message);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "서버 오류가 발생했습니다. 잠시 후에 다시 시도해주세요.",
    });
  }
};

module.exports = {
  serverError,
  sqlError,
  jwtError,
};
