const express = require("express");
const router = express.Router();

const { authenticateToken, refreshAccessToken } = require("../middlewares/authMiddleware");
const {
  validateJoin,
  validateLogin,
  validateRequestResetPW,
  validateResetPW,
} = require("../middlewares/validateMiddleware");
const {
  join,
  login,
  logout,
  requestPwdReset,
  performPwdReset,
} = require("../controllers/usersController");

router.post("/join", validateJoin, join);
router.post("/login", validateLogin, login);
router.post("/logout", authenticateToken, refreshAccessToken, logout);
router.post("/reset", validateRequestResetPW, requestPwdReset);
router.put("/reset", validateResetPW, performPwdReset);

module.exports = router;
