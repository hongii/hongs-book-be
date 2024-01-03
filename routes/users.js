const express = require("express");
const router = express.Router();
router.use(express.json());

const { body } = require("express-validator");
const {
  join,
  login,
  requestPwdReset,
  performPwdReset,
  validate,
} = require("../controller/userController");

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

router.post(
  "/login",
  [
    body("email").notEmpty().withMessage("이메일을 입력해주세요."),
    body("password").notEmpty().withMessage("비밀번호를 입력해주세요."),
    validate,
  ],
  login,
);

router.post("/reset", requestPwdReset);
router.put("/reset", performPwdReset);

module.exports = router;
