const { StatusCodes, getReasonPhrase } = require("http-status-codes");
const { TokenExpiredError, JsonWebTokenError } = require("jsonwebtoken");

class CustomError extends Error {
  constructor(message, statusCode) {
    super(message || getReasonPhrase(statusCode));
    this.name = "CustomError";
    this.statusCode = statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  }
}

const handleCustomError = (err, res) => {
  return res.status(err.statusCode).json({ message: err.message });
};

const handleTokenExpiredError = (res) => {
  return res.status(StatusCodes.UNAUTHORIZED).json({
    message: "로그인(인증) 토큰이 만료되었습니다. 다시 로그인 후 사용해주세요.",
  });
};

const handleJsonWebTokenError = (res) =>
  res.status(StatusCodes.FORBIDDEN).json({ message: "유효하지 않은 토큰입니다." });

const handleSQLError = (res) => {
  return res.status(StatusCodes.BAD_REQUEST).json({
    message: "잘못된 정보를 입력하였습니다. 확인 후 다시 입력해주세요.",
  });
};

const handleServerError = (res) => {
  return res.status(StatusCodes.BAD_REQUEST).json({
    message: "잘못된 정보를 입력하였습니다. 확인 후 다시 입력해주세요.",
  });
};

const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err instanceof CustomError) {
    handleCustomError(err, res);
  } else if (err instanceof TokenExpiredError) {
    handleTokenExpiredError(res);
  } else if (err instanceof JsonWebTokenError) {
    handleJsonWebTokenError(res);
  } else if (err.code && err.code.startsWith("ER_")) {
    handleSQLError(res);
  } else {
    handleServerError(res);
  }
};

module.exports = { CustomError, errorHandler };
