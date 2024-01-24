const jwt = require("jsonwebtoken");
require("dotenv").config();
const privateKey = process.env.PRIVATE_KEY;

const createToken = (type, user) => {
  const { email, id: uid } = user;
  const tokenData = {
    accessToken: { email, uid },
    refreshToken: { uid },
  };
  const tokenConfig = {
    accessTokenConfig: {
      expiresIn: process.env.ACCESSTOKEN_LIFETIME,
      issuer: process.env.ACCESSTOKEN_ISSUER,
    },
    refreshTokenConfig: {
      expiresIn: process.env.REFRESHTOKEN_LIFETIME,
      issuer: process.env.REFRESHTOKEN_ISSUER,
    },
  };

  const token = jwt.sign(tokenData[type], privateKey, tokenConfig[type]);
  return token;
};
module.exports = { createToken };
