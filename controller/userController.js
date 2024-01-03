const conn = require("../mariadb").promise();
const { validationResult } = require("express-validator");
const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const dotenv = require("dotenv");
dotenv.config();
const privateKey = process.env.PRIVATE_KEY;

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

    // 새로운 회원 데이터 넣기 전에 이미 가입된 회원인지 아닌지 확인
    let sql = `SELECT * FROM users WHERE email = ?`;
    const [results] = await conn.query(sql, email);
    if (results.length > 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "이미 가입된 이메일입니다. 다른 이메일을 입력해주세요." });
    }

    // 비밀번호 암호화
    const salt = crypto.randomBytes(32).toString("base64");
    const hashPassword = crypto.pbkdf2Sync(password, salt, 10000, 32, "sha512").toString("base64");

    sql = "INSERT INTO users (email, password, salt) VALUES (?, ?, ?)";
    const values = [email, hashPassword, salt];
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
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email=?";
    const [results] = await conn.query(sql, email);
    const targetUser = results[0];

    if (targetUser) {
      // db에 저장된 salt값으로 입력받은 비밀번호를 암호화
      const salt = targetUser.salt;
      const hashPassword = crypto
        .pbkdf2Sync(password, salt, 10000, 32, "sha512")
        .toString("base64");

      // db에 저장되어 있는 암호화된 비밀번호와 일치하는지 확인
      if (targetUser.password === hashPassword) {
        let accessToken = jwt.sign({ email: targetUser.email }, privateKey, {
          expiresIn: "10m",
          issuer: "euni",
        });

        res.cookie("access_token", accessToken, { httpOnly: true });
        return res.status(StatusCodes.OK).json({ data: targetUser });
      }
    }

    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: "이메일 또는 비밀번호를 잘못 입력했습니다. 입력하신 내용을 다시 확인해주세요.",
    });
  } catch (err) {
    if (err.code && err.code.startsWith("ER_")) {
      sqlError(res, err);
    } else {
      serverError(res, err);
    }
  }
};

/* 비밀번호 초기화 요청(로그인 하기 전, 비밀번호 찾기 기능) */
const requestPwdReset = async (req, res) => {
  try {
    const { email } = req.body;

    const sql = "SELECT * FROM users WHERE email=?";
    const [results] = await conn.query(sql, email);
    const targetUser = results[0];
    if (targetUser) {
      return res.status(StatusCodes.OK).json({ email: targetUser.email });
    }

    return res
      .status(StatusCodes.NOT_FOUND)
      .json({
        message: "존재하지 않는 이메일입니다. 가입한 이메일 정보를 정확히 입력해주세요.",
      })
      .end();
  } catch (err) {
    if (err.code && err.code.startsWith("ER_")) {
      sqlError(res, err);
    } else {
      serverError(res, err);
    }
  }
};

/* 비밀번호 초기화(새로운 비밀번호로 변경하는 기능) */
const performPwdReset = async (req, res) => {
  try {
    const { email, password: newPW } = req.body;

    const sql = "UPDATE users SET password=? WHERE email=?";
    const values = [newPW, email];
    const [results] = await conn.query(sql, values);
    console.log(results);
    if (results.affectedRows > 0) {
      return res.status(StatusCodes.OK).json({ message: "비밀번호가 변경되었습니다." });
    }

    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({
        message: "잘못된 요청입니다. 입력한 정보를 다시 확인해주세요.",
      })
      .end();
  } catch (err) {
    if (err.code && err.code.startsWith("ER_")) {
      sqlError(res, err);
    } else {
      serverError(res, err);
    }
  }
};

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

module.exports = { join, login, requestPwdReset, performPwdReset, validate };
