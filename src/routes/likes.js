const express = require("express");
const router = express.Router();
router.use(express.json());

const authenticateToken = require("../middleware/auth");
const { likeAndUnlikeBook } = require("../controller/likeController");

router.post("/:bookId", authenticateToken, likeAndUnlikeBook);
// router.delete("/:bookId", authenticateToken, likeAndUnlikeBook);

module.exports = router;
