const { validationResult } = require("express-validator");
const { StatusCodes } = require("http-status-codes");

/* 사용자 입력값 유효성 검증 미들웨어 */
const validate = (req, res, next) => {
  const validateErr = validationResult(req);
  if (validateErr.isEmpty()) {
    return next();
  }

  console.error(validateErr.array());
  const errMsg = validateErr.array().map((obj) => obj.msg);
  return res.status(StatusCodes.BAD_REQUEST).json({ message: errMsg }).end();
};

module.exports = validate;
