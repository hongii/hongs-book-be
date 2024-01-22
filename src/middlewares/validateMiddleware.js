const { validationResult } = require("express-validator");
const { StatusCodes } = require("http-status-codes");
const { body, param, query } = require("express-validator");
const { CustomError } = require("./errorHandlerMiddleware");

/* 사용자 입력값 유효성 검사 미들웨어 */
const validateRequest = (req, res, next) => {
  const validateErr = validationResult(req);
  if (validateErr.isEmpty()) {
    return next();
  }

  console.error(validateErr);
  const errMsg = validateErr.array().map((obj) => obj.msg);
  if (errMsg.length > 1) {
    return next(new CustomError(errMsg, StatusCodes.BAD_REQUEST, true));
  }
  return next(new CustomError(errMsg[0], StatusCodes.BAD_REQUEST));
};

/* 유효성 검사 체이닝 */
const validateChainOnlyJoinEmail = body("email")
  .notEmpty()
  .withMessage("이메일은 필수 입력 정보입니다.")
  .bail()
  .isEmail()
  .withMessage("잘못된 이메일 형식입니다. 올바른 이메일 정보를 입력해주세요.");

const validateChainOnlyJoinPassword = body("password")
  .notEmpty()
  .withMessage("비밀번호는 필수 입력 정보입니다.")
  .bail()
  .isLength({ min: 4, max: 16 })
  .withMessage("비밀번호는 4~16자 이내로 입력해주세요.");

const validateChainName = body("name")
  .notEmpty()
  .withMessage("이름은 필수 입력 정보입니다.")
  .bail()
  .isLength({ min: 2 })
  .withMessage("이름은 2글자 이상 입력해야 합니다!");

const validateChainContact = body("contact")
  .notEmpty()
  .withMessage("연락처는 필수 입력 정보입니다.")
  .bail()
  .matches(/^(\d{3}-\d{3}-\d{4}|\d{3}-\d{4}-\d{4})$/)
  .withMessage(`- 기호를 넣어서 모바일 연락처 형식에 맞게 입력해주세요.`);

const validateChainEmail = body("email").notEmpty().withMessage("이메일을 입력해주세요.");

const validateChainPassword = body("password").notEmpty().withMessage("비밀번호를 입력해주세요.");

const validateChainNewPassword = body("password")
  .notEmpty()
  .withMessage("새롭게 변경할 비밀번호를 입력해주세요.")
  .bail()
  .isLength({ min: 4, max: 16 })
  .withMessage("비밀번호는 4~16자 이내로 입력해주세요.");

const validateChainIsInt = (location, path, opt = false, isOverZero = true) => {
  let locationMethod = null;
  if (location === "params") locationMethod = param(path);
  else if (location === "body") locationMethod = body(path);
  else locationMethod = query(path);

  if (opt) locationMethod = locationMethod.optional();

  if (isOverZero) locationMethod = locationMethod.isInt({ allow_leading_zeroes: false, min: 1 });
  else locationMethod = locationMethod.isInt({ allow_leading_zeroes: false });

  return locationMethod.withMessage(
    `${location}의 ${path}는 ${opt ? "" : "필수 정보이며 "}1 이상의 정수여야 합니다.`,
  );
};

const validateChainIsBoolean = (location, path, opt = false) => {
  let locationMethod = null;
  if (location === "params") locationMethod = param(path);
  else if (location === "body") locationMethod = body(path);
  else locationMethod = query(path);

  if (opt) locationMethod = locationMethod.optional();

  return locationMethod
    .isBoolean()
    .withMessage(`${location}의 ${path}는 ${opt ? "" : "필수 정보이며 "}boolean타입이어야 합니다.`);
};

const validateChainIsString = (location, path, opt = false) => {
  let locationMethod = null;
  if (location === "params") locationMethod = param(path);
  else if (location === "body") locationMethod = body(path);
  else locationMethod = query(path);

  if (opt) locationMethod = locationMethod.optional();

  return locationMethod
    .custom((str) => {
      return str && typeof str === "string" && str.trim().length > 0;
    })
    .withMessage(`${location}의 ${path}는 ${opt ? "" : "필수 정보이며 "}string타입이어야 합니다.`);
};

const validateChainStringObj = (path) => {
  return body(path)
    .isObject()
    .custom((obj) => {
      return (
        obj.hasOwnProperty("address") &&
        obj.hasOwnProperty("receiver") &&
        obj.hasOwnProperty("contact") &&
        typeof obj.address === "string" &&
        obj.address.trim().length > 0 &&
        typeof obj.receiver === "string" &&
        obj.receiver.trim().length > 0 &&
        typeof obj.contact === "string" &&
        obj.contact.trim().length > 0
      );
    })
    .withMessage(`${path}의 데이터 형식이 틀렸습니다.`);
};

const validateChainIntArr = (path) => {
  return body(path)
    .optional({ nullable: true })
    .isArray({ min: 1 })
    .withMessage(`최소한 한 개 이상의 데이터가 있어야합니다.`)
    .custom((intArr) => {
      return intArr.every((intElem) => intElem > 0 && Number.isInteger(intElem));
    })
    .withMessage(`${path}의 데이터 형식이 틀렸습니다.`);
};

const validateChainObjArr = (path) => {
  return body(path)
    .isArray({ min: 1 })
    .withMessage(`${path}에 최소한 한 개 이상의 데이터가 있어야합니다.`)
    .custom((objArr) => {
      return objArr.every(
        (obj) =>
          obj.hasOwnProperty("cartItemId") &&
          obj.hasOwnProperty("bookId") &&
          obj.hasOwnProperty("quantity") &&
          Number.isInteger(obj.cartItemId) &&
          obj.cartItemId > 0 &&
          Number.isInteger(obj.bookId) &&
          obj.bookId > 0 &&
          Number.isInteger(obj.quantity),
      );
    })
    .withMessage(`${path}의 데이터 형식이 틀렸습니다.`);
};

/* 유효성 검사 미들웨어 조합 */
const validateJoin = [
  validateChainOnlyJoinEmail,
  validateChainOnlyJoinPassword,
  validateChainName,
  validateChainContact,
  validateRequest,
];
const validateLogin = [validateChainEmail, validateChainPassword, validateRequest];
const validateRequestResetPW = [validateChainPassword, validateRequest];
const validateResetPW = [validateChainEmail, validateChainNewPassword, validateRequest];
const validateGetBooks = [
  validateChainIsInt("query", "page"),
  validateChainIsInt("query", "limit"),
  validateChainIsBoolean("query", "new", true),
  validateChainIsInt("query", "category_id", true),
  validateRequest,
];
const validateParamBookId = [validateChainIsInt("params", "bookId"), validateRequest];
const validateGetAddToCart = [
  validateChainIsInt("body", "bookId"),
  validateChainIsInt("body", "quantity"),
  validateRequest,
];
const validateGetCartItems = [validateChainIntArr("selected"), validateRequest];
const validateRequestPayment = [
  validateChainObjArr("items"),
  validateChainStringObj("delivery"),
  validateChainIsString("body", "mainBookTitle"),
  validateChainIsInt("body", "totalPrice", false, false),
  validateChainIsInt("body", "totalQuantity"),
  validateRequest,
];
const validateGetOrderListDetails = [validateChainIsInt("params", "orderId"), validateRequest];

module.exports = {
  validateJoin,
  validateLogin,
  validateRequestResetPW,
  validateResetPW,
  validateGetBooks,
  validateGetBookDetail: validateParamBookId,
  validateLikeAndUnlikeBook: validateParamBookId,
  validateGetAddToCart,
  validateGetCartItems,
  validateRemoveFromCart: validateParamBookId,
  validateRequestPayment,
  validateGetOrderListDetails: validateGetOrderListDetails,
};
