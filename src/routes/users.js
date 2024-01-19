const express = require("express");
const router = express.Router();

const { body } = require("express-validator");
const { join, login, requestPwdReset, performPwdReset } = require("../controllers/usersController");
const {
  validateJoin,
  validateLogin,
  validateRequestResetPW,
  validateResetPW,
} = require("../middlewares/validateMiddleware");

router.post("/join", validateJoin, join);
router.post("/login", validateLogin, login);
router.post("/reset", validateRequestResetPW, requestPwdReset);
router.put("/reset", validateResetPW, performPwdReset);

module.exports = router;
