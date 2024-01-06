const express = require("express");
const router = express.Router();
router.use(express.json());

const { likeBook, unlikeBook } = require("../controller/likeController");
router.post("/:bookId", likeBook);
router.delete("/:bookId", unlikeBook);

module.exports = router;
