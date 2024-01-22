const express = require("express");
const router = express.Router();

const { authenticateToken, refreshAccessToken } = require("../middlewares/authMiddleware");
const { validateGetBooks, validateGetBookDetail } = require("../middlewares/validateMiddleware");
const { getBooksInfo, getBookDetail } = require("../controllers/booksController");

router.get("/", validateGetBooks, getBooksInfo);
router.get("/:bookId", validateGetBookDetail, authenticateToken, refreshAccessToken, getBookDetail);

module.exports = router;
