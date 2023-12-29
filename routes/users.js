const express = require("express");
const router = express.Router();
router.use(express.json());

/* 회원 가입 */
const join = (req, res) => {};

/* 로그인 */
const login = (req, res) => {};

/* 비밀번호 초기화 요청 */
const requestPwdReset = (req, res) => {};

/* 비밀번호 초기화 */
const performPwdReset = (req, res) => {};

router.post("/join", join);
router.post("/login", login);
router.post("/reset", requestPwdReset);
router.put("/reset", performPwdReset);

module.exports = router;
