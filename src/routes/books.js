const express = require("express");
const router = express.Router();

const { getBooksInfo, getBookDetail } = require("../controllers/bookController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.get("/", getBooksInfo);
router.get("/:bookId", authenticateToken, getBookDetail);

module.exports = router;
