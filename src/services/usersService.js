const conn = require("../../database/mariadb").promise();
const { StatusCodes } = require("http-status-codes");
const { CustomError } = require("../middlewares/errorHandlerMiddleware");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
require("dotenv").config();
const privateKey = process.env.PRIVATE_KEY;

const joinService = async (email, password, name, contact) => {
  // 새로운 회원 데이터 넣기 전에 이미 가입된 회원인지 아닌지 확인
  let sql = `SELECT * FROM users WHERE email = ?`;
  let [results] = await conn.query(sql, [email]);
  if (results.length > 0) {
    throw new CustomError(
      "이미 가입된 이메일입니다. 다른 이메일을 입력해주세요.",
      StatusCodes.BAD_REQUEST,
    );
  }

  // 비밀번호 암호화
  const salt = crypto.randomBytes(32).toString("base64");
  const hashPassword = crypto.pbkdf2Sync(password, salt, 10000, 32, "sha512").toString("base64");

  sql = "INSERT INTO users (email, password, name, contact, salt) VALUES (?, ?, ?, ?, ?)";
  const values = [email, hashPassword, name, contact, salt];
  [results] = await conn.query(sql, values);
  if (results.affectedRows > 0) {
    return { message: "회원가입이 완료되었습니다. 로그인을 진행해주세요." };
  }
  throw new CustomError("잘못된 요청입니다. 확인 후 다시 시도해주세요.", StatusCodes.BAD_REQUEST);
};

/* 로그인 */
const loginService = async (email, password) => {
  const sql = "SELECT * FROM users WHERE email=?";
  const [results] = await conn.query(sql, [email]);
  const targetUser = results[0];

  if (targetUser) {
    // db에 저장된 salt값으로 입력받은 비밀번호를 암호화
    const salt = targetUser.salt;
    const hashPassword = crypto.pbkdf2Sync(password, salt, 10000, 32, "sha512").toString("base64");

    // db에 저장되어 있는 암호화된 비밀번호와 일치하는지 확인
    if (targetUser.password === hashPassword) {
      let accessToken = jwt.sign({ email: targetUser.email, uid: targetUser.id }, privateKey, {
        expiresIn: process.env.ACCESSTOKEN_LIFETIME,
        issuer: process.env.ACCESSTOKEN_ISSUER,
      });

      let refreshToken = jwt.sign({ uid: targetUser.id }, privateKey, {
        expiresIn: process.env.REFRESHTOKEN_LIFETIME,
        issuer: process.env.REFRESHTOKEN_ISSUER,
      });

      const sql = "UPDATE users SET refresh_token=? WHERE id=?";
      const values = [refreshToken, targetUser.id];
      const [results] = await conn.query(sql, values);
      if (results.affectedRows > 0) {
        return {
          data: {
            id: targetUser.id,
            email: targetUser.email,
            name: targetUser.name,
            contact: targetUser.contact,
          },
          accessToken,
          refreshToken,
        };
      }
    }
  }

  throw new CustomError(
    "이메일 또는 비밀번호를 잘못 입력했습니다. 입력하신 내용을 다시 확인해주세요.",
    StatusCodes.BAD_REQUEST,
  );
};

/* 비밀번호 초기화 요청(로그인 하기 전, 비밀번호 찾기 기능) */
const requestPwdResetService = async (email) => {
  const sql = "SELECT * FROM users WHERE email=?";
  const [results] = await conn.query(sql, [email]);
  const targetUser = results[0];
  if (targetUser) {
    return { data: { email: targetUser.email } };
  }

  throw new CustomError(
    "존재하지 않는 이메일입니다. 가입한 이메일 정보를 정확히 입력해주세요.",
    StatusCodes.NOT_FOUND,
  );
};

/* 비밀번호 초기화(새로운 비밀번호로 변경하는 기능) */
const performPwdResetService = async (email, newPW) => {
  // 비밀번호 암호화
  const salt = crypto.randomBytes(32).toString("base64");
  const hashPassword = crypto.pbkdf2Sync(newPW, salt, 10000, 32, "sha512").toString("base64");

  const sql = "UPDATE users SET password=?, salt=? WHERE email=?";
  const values = [hashPassword, salt, email];
  const [results] = await conn.query(sql, values);
  if (results.affectedRows > 0) {
    return { message: "비밀번호가 변경되었습니다." };
  }

  throw new CustomError("잘못된 요청입니다. 확인 후 다시 시도해주세요.", StatusCodes.BAD_REQUEST);
};

module.exports = { joinService, loginService, requestPwdResetService, performPwdResetService };
