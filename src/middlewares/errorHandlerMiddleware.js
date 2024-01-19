const { StatusCodes, getReasonPhrase } = require("http-status-codes");
const { TokenExpiredError, JsonWebTokenError } = require("jsonwebtoken");

class CustomError extends Error {
  constructor(errorMessages, statusCode, multiErrMsg = false) {
    const message = Array.isArray(errorMessages) ? errorMessages.join(", ") : String(errorMessages);

    super(message || getReasonPhrase(statusCode));
    this.name = "CustomError";
    this.statusCode = statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    this.multiErrMsg = multiErrMsg;
  }
}

const handleCustomError = (err, res) => {
  if (err.multiErrMsg) {
    const errMsgArr = err.message.split(", ");
    return res.status(err.statusCode).json({ message: errMsgArr });
  }
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
    message: "잘못된 요청입니다. 확인 후 다시 시도해주세요.",
  });
};

const handleServerError = (res) => {
  return res.status(StatusCodes.BAD_REQUEST).json({
    message: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
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

const handleNotFound = (req, res) => {
  return res.status(StatusCodes.NOT_FOUND).json({
    message: "요청한 경로를 찾을 수 없습니다.",
  });
};

module.exports = { CustomError, errorHandler, handleNotFound };
