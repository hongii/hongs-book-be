const express = require("express");
const router = express.Router();
router.use(express.json());

const conn = require("../mariadb").promise();
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { StatusCodes } = require("http-status-codes");

const dotenv = require("dotenv");
dotenv.config();
const privateKey = process.env.PRIVATE_KEY;

const validate = (req, res, next) => {
  const validateErr = validationResult(req);
  if (validateErr.isEmpty()) {
    return next();
  }

  console.error(validateErr.array());
  const errMsg = validateErr.array().map((obj) => obj.msg);
  return res.status(StatusCodes.BAD_REQUEST).json({ message: errMsg }).end();
};

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

/* 회원 가입 */
const join = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 데이터 넣기 전에 먼저 회원인지 아닌지 확인하는 코드 추가
    let sql = `SELECT * FROM users WHERE email = ?`;
    const [results] = await conn.query(sql, email);
    if (results.length > 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "이미 가입된 이메일입니다. 다른 이메일을 입력해주세요." });
    }

    sql = "INSERT INTO users (email, password) VALUES (?, ?)";
    const values = [email, password];
    await conn.query(sql, values);

    return res
      .status(StatusCodes.CREATED)
      .json({ message: "회원가입이 완료되었습니다. 로그인을 진행해주세요." });
  } catch (err) {
    if (err.code && err.code.startsWith("ER_")) {
      // 데이터베이스 오류일 경우 -> MairaDB에서는 오류코드가 "ER_"로 시작됨
      sqlError(res, err);
    } else {
      // 서버 오류일 경우
      serverError(res, err);
    }
  }
};

/* 로그인 */
const login = (req, res) => {};

/* 비밀번호 초기화 요청 */
const requestPwdReset = (req, res) => {};

/* 비밀번호 초기화 */
const performPwdReset = (req, res) => {};

router.post(
  "/join",
  [
    body("email")
      .notEmpty()
      .withMessage("이메일은 필수 입력 정보입니다.")
      .bail()
      .isEmail()
      .withMessage("잘못된 이메일 형식입니다. 올바른 이메일 정보를 입력해주세요."),
    body("password")
      .notEmpty()
      .withMessage("비밀번호는 필수 입력 정보입니다.")
      .bail()
      .isLength({ min: 4, max: 16 })
      .withMessage("비밀번호는 4~16자 이내로 입력해주세요."),
    validate,
  ],
  join,
);
router.post("/login", login);
router.post("/reset", requestPwdReset);
router.put("/reset", performPwdReset);

module.exports = router;
