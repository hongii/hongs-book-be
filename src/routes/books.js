const express = require("express");
const router = express.Router();
router.use(express.json());

/* 전체 도서 조회 */
const getTotalBooks = (req, res) => {};

/* 개별 도서 조회 */
const getBookInfo = (req, res) => {};

/* 카테고리 별 도서 목록 조회 */
const getCategoryBooks = (req, res) => {};

router.get("/", getTotalBooks);
router.get("/:bookId", getBookInfo);
router.get("/", getCategoryBooks);

module.exports = router;
