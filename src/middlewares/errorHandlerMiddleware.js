const { StatusCodes } = require("http-status-codes");
const { TokenExpiredError, JsonWebTokenError } = require("jsonwebtoken");

const ERROR_MESSAGES = {
  BAD_REQUEST: "잘못된 요청입니다. 확인 후 다시 시도해주세요.",
  SERVER_ERROR: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
  NOT_FOUND: "존재하지 않는 페이지입니다.",
  TOKEN_EXPIRED: "로그인(인증) 토큰이 만료되었습니다. 다시 로그인 후 사용해주세요.",
  INVALID_TOKEN: "유효하지 않은 토큰입니다.",
  LOGIN_REQUIRED: "로그인이 필요합니다. 로그인 후 이용해주세요.",
  REFRESH_TOKEN_MISMATCH: "refresh token정보가 일치하지 않습니다. 다시 로그인 후 사용해주세요.",
  REFRESH_TOKEN_RESET_FAILED: "Refresh Token 초기화에 실패했습니다. 다시 로그인 후 사용해주세요.",
  BOOKS_NOT_FOUND: "존재하지 않는 도서입니다.",
  DUPLICATE_EMAIL: "이미 가입된 이메일입니다. 다른 이메일을 입력해주세요.",
  LOGIN_UNAUTHORIZED: "로그인 도중에 문제가 생겼습니다. 로그인을 다시 시도해주세요.",
  LOGIN_BAD_REQUEST: "이메일 또는 비밀번호를 잘못 입력했습니다. 입력하신 내용을 다시 확인해주세요.",
  EMAIL_NOT_FOUND: "존재하지 않는 이메일입니다. 가입한 이메일을 정확히 입력해주세요.",
  ORDER_ERROR: "결제 진행 중 오류가 발생했습니다.",
  CART_DATA_MISMATCH: "결제 진행 중 오류가 발생했습니다. (장바구니 정보와 일치하지 않습니다.)",
};

class CustomError extends Error {
  constructor(errorMessages) {
    super();
    this.name = "CustomError";
    this.message = errorMessages;
  }
}

const handleCustomError = (err, res) => {
  switch (err.message) {
    case ERROR_MESSAGES.REFRESH_TOKEN_MISMATCH:
    case ERROR_MESSAGES.REFRESH_TOKEN_RESET_FAILED:
    case ERROR_MESSAGES.LOGIN_UNAUTHORIZED:
    case ERROR_MESSAGES.LOGIN_REQUIRED:
    case ERROR_MESSAGES.TOKEN_EXPIRED:
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: err.message });

    case ERROR_MESSAGES.EMAIL_NOT_FOUND:
    case ERROR_MESSAGES.BOOKS_NOT_FOUND:
      return res.status(StatusCodes.NOT_FOUND).json({ message: err.message });

    default:
      return res.status(StatusCodes.BAD_REQUEST).json({ message: err.message });
  }
};

const handleTokenExpiredError = (res) => {
  return res.status(StatusCodes.UNAUTHORIZED).json({
    message: ERROR_MESSAGES.TOKEN_EXPIRED,
  });
};

const handleJsonWebTokenError = (res) =>
  res.status(StatusCodes.FORBIDDEN).json({ message: ERROR_MESSAGES.INVALID_TOKEN });

const handleSQLError = (res) => {
  return res.status(StatusCodes.BAD_REQUEST).json({
    message: ERROR_MESSAGES.BAD_REQUEST,
  });
};

const handleServerError = (res) => {
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: ERROR_MESSAGES.SERVER_ERROR,
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
    message: ERROR_MESSAGES.NOT_FOUND,
  });
};

module.exports = { CustomError, errorHandler, handleNotFound, ERROR_MESSAGES };
