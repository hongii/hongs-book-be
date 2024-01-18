const express = require("express");
const router = express.Router();

const authenticateToken = require("../middlewares/auth");
const { likeAndUnlikeBook } = require("../controllers/likeController");

router.post("/:bookId", authenticateToken, likeAndUnlikeBook);
// router.delete("/:bookId", authenticateToken, likeAndUnlikeBook);

module.exports = router;
