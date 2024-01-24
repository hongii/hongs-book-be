const crypto = require("crypto");

const encryptPassword = (password, oldSalt = null) => {
  // 비밀번호 암호화
  const salt = oldSalt ? oldSalt : crypto.randomBytes(32).toString("base64");
  const hashPassword = crypto.pbkdf2Sync(password, salt, 10000, 32, "sha512").toString("base64");

  return { hashPassword, salt };
};

module.exports = { encryptPassword };
