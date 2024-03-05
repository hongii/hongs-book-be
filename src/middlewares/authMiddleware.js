const { asyncWrapper } = require("../middlewares/asyncWrapperMiddleware");
const { CustomError, ERROR_MESSAGES } = require("../middlewares/errorHandlerMiddleware");
const { refreshAccessTokenService } = require("../services/authService");
const jwt = require("jsonwebtoken");
const privateKey = process.env.PRIVATE_KEY;

const authenticateToken = async (req, res, next) => {
  const endPoint = req.originalUrl.split("/").slice(0, 3).join("/");
  const accessToken = req.headers.authorization?.split(" ")[1];
  if (!accessToken) {
    if (endPoint === "/api/books") {
      return next();
    } else {
      throw new CustomError(ERROR_MESSAGES.LOGIN_REQUIRED);
    }
  }

  try {
    const { uid } = jwt.verify(accessToken, privateKey);
    req.user = { id: uid };
    req.expired = false;
    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      console.log("Access token expired.");
      const { uid } = jwt.decode(accessToken);
      req.user = { id: uid };
      req.expired = true;
      return next();
    }
    next(err);
  }
};

const refreshAccessToken = async (req, res, next) => {
  const endPoint = req.originalUrl;
  const expired = req.expired;
  if (!expired) {
    return next();
  } else if (endPoint === "/api/users/logout") {
    return next(); // logout시에는 굳이 만료된 토큰을 재발급 받을 필요 없지 않을까
  }

  const { refresh_token: refreshToken } = req.cookies;
  if (!refreshToken) {
    throw new CustomError(ERROR_MESSAGES.TOKEN_EXPIRED);
  }

  try {
    const { id: userId } = req.user;
    const { newAccessToken, newRefreshToken } = await refreshAccessTokenService(
      userId,
      refreshToken,
    );

    res.cookie("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 14, // 14일
    });

    res.header("Authorization", `Bearer ${newAccessToken}`);
    console.log("Access token refreshed.");
    return next();
  } catch (err) {
    res.cookie("refresh_token", "", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      path: "/",
      maxAge: 0,
    });
    return next(err);
  }
};

module.exports = {
  authenticateToken: asyncWrapper(authenticateToken),
  refreshAccessToken: asyncWrapper(refreshAccessToken),
};
