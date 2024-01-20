const { StatusCodes } = require("http-status-codes");
const { asyncWrapper } = require("../middlewares/asyncWrapperMiddleware");
const {
  joinService,
  loginService,
  performPwdResetService,
  requestPwdResetService,
  logoutService,
} = require("../services/usersService");
require("dotenv").config();

/* 회원 가입 */
const join = async (req, res) => {
  const { email, password, name, contact } = req.body;

  const { message } = await joinService(email, password, name, contact);
  return res.status(StatusCodes.CREATED).json({ message });
};

/* 로그인 */
const login = async (req, res) => {
  const { email, password } = req.body;

  const { data, accessToken, refreshToken } = await loginService(email, password);

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 14,
  });

  res.header("Authorization", `Bearer ${accessToken}`);

  return res.status(StatusCodes.OK).json({ data });
};

/* 로그아웃 */
const logout = async (req, res) => {
  const { id: userId } = req.user;
  const { message } = await logoutService(userId);

  res.cookie("refresh_token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    path: "/",
    maxAge: 0,
  });
  res.header("Authorization", "logout");
  return res.status(StatusCodes.OK).json({ message });
};

/* 비밀번호 초기화 요청(로그인 하기 전, 비밀번호 찾기 기능) */
const requestPwdReset = async (req, res) => {
  const { email } = req.body;

  const { data } = await requestPwdResetService(email);
  return res.status(StatusCodes.OK).json({ data });
};

/* 비밀번호 초기화(새로운 비밀번호로 변경하는 기능) */
const performPwdReset = async (req, res) => {
  const { email, password: newPW } = req.body;

  const { message } = await performPwdResetService(email, newPW);
  return res.status(StatusCodes.OK).json({ message });
};

module.exports = {
  join: asyncWrapper(join),
  login: asyncWrapper(login),
  logout: asyncWrapper(logout),
  requestPwdReset: asyncWrapper(requestPwdReset),
  performPwdReset: asyncWrapper(performPwdReset),
};
