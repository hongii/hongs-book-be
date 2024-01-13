const express = require("express");
const router = express.Router();
router.use(express.json());

const authenticateToken = require("../middleware/auth");
const { likeBook, unlikeBook } = require("../controller/likeController");

router.post("/:bookId", authenticateToken, likeBook);
router.delete("/:bookId", authenticateToken, unlikeBook);

module.exports = router;
