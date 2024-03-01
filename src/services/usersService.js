const conn = require("../../database/mariadb").promise();
const { StatusCodes } = require("http-status-codes");
const { CustomError, ERROR_MESSAGES } = require("../middlewares/errorHandlerMiddleware");
const { encryptPassword } = require("../utils/encryptPassword");
const { createToken } = require("../utils/createToken");
const { resetRefreshToken } = require("./authService");

const RESPONSE_MESSAGES = {
  JOIN_SUCCESS: "회원가입이 완료되었습니다. 로그인을 진행해주세요.",
  LOGOUT_SUCCESS: "로그아웃 되었습니다.",
  RESET_PASSWORD: "비밀번호가 변경되었습니다. 로그인을 진행해주세요.",
};

const joinService = async (email, password, name, contact) => {
  // 새로운 회원 데이터 넣기 전에 이미 가입된 회원인지 아닌지 확인
  let sql = `SELECT * FROM users WHERE email = ?`;
  let [results] = await conn.query(sql, [email]);
  if (results.length > 0) {
    throw new CustomError(ERROR_MESSAGES.DUPLICATE_EMAIL, StatusCodes.BAD_REQUEST);
  }

  // 비밀번호 암호화
  const { hashPassword, salt } = encryptPassword(password);

  sql = "INSERT INTO users (email, password, name, contact, salt) VALUES (?, ?, ?, ?, ?)";
  const values = [email, hashPassword, name, contact, salt];
  [results] = await conn.query(sql, values);
  if (results.affectedRows === 1) {
    return { message: RESPONSE_MESSAGES.JOIN_SUCCESS };
  }
  throw new CustomError(ERROR_MESSAGES.BAD_REQUEST, StatusCodes.BAD_REQUEST);
};

/* 로그인 */
const loginService = async (email, password) => {
  const sql = "SELECT * FROM users WHERE email=?";
  const [results] = await conn.query(sql, [email]);

  if (results.length === 1) {
    const targetUser = results[0];

    // db에 저장된 salt값으로 입력받은 비밀번호를 암호화
    const { hashPassword } = encryptPassword(password, targetUser.salt);

    // db에 저장되어 있는 암호화된 비밀번호와 일치하는지 확인
    if (targetUser.password === hashPassword) {
      const accessToken = createToken("accessToken", targetUser);
      const refreshToken = createToken("refreshToken", targetUser);

      const sql = "UPDATE users SET refresh_token=? WHERE id=?";
      const values = [refreshToken, targetUser.id];
      const [results] = await conn.query(sql, values);
      if (results.affectedRows === 1) {
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
      throw new CustomError(ERROR_MESSAGES.LOGIN_UNAUTHORIZED, StatusCodes.UNAUTHORIZED);
    }
  }

  throw new CustomError(ERROR_MESSAGES.LOGIN_BAD_REQUEST, StatusCodes.BAD_REQUEST);
};

/* 로그아웃 */
const logoutService = async (userId) => {
  const isResetRefreshToken = await resetRefreshToken(userId);
  if (isResetRefreshToken) {
    return { message: RESPONSE_MESSAGES.LOGOUT_SUCCESS };
  }

  throw new CustomError(ERROR_MESSAGES.BAD_REQUEST, StatusCodes.BAD_REQUEST);
};

/* 비밀번호 초기화 요청(로그인 하기 전, 비밀번호 찾기 기능) */
const requestPwdResetService = async (email) => {
  const sql = "SELECT * FROM users WHERE email=?";
  const [results] = await conn.query(sql, [email]);
  if (results.length === 1) {
    const targetUser = results[0];
    return { data: { email: targetUser.email } };
  }

  throw new CustomError(ERROR_MESSAGES.EMAIL_NOT_FOUND, StatusCodes.NOT_FOUND);
};

/* 비밀번호 초기화(새로운 비밀번호로 변경하는 기능) */
const performPwdResetService = async (email, newPW) => {
  const { hashPassword, salt } = encryptPassword(newPW);

  const sql = "UPDATE users SET password=?, salt=? WHERE email=?";
  const values = [hashPassword, salt, email];
  const [results] = await conn.query(sql, values);
  if (results.affectedRows === 1) {
    return { message: RESPONSE_MESSAGES.RESET_PASSWORD };
  }

  throw new CustomError(ERROR_MESSAGES.BAD_REQUEST, StatusCodes.BAD_REQUEST);
};

module.exports = {
  joinService,
  loginService,
  logoutService,
  requestPwdResetService,
  performPwdResetService,
};
