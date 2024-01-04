const express = require("express");
const router = express.Router();
router.use(express.json());

/* 좋아요 추가 */
const likeBook = (req, res) => {};

/* 좋아요 추가 */
const unlikeBook = (req, res) => {};

router.post("/:bookId", likeBook);
router.delete("/:bookId", unlikeBook);

module.exports = router;
