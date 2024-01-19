const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middlewares/authMiddleware");
const { likeAndUnlikeBook } = require("../controllers/likesController");
const { validateLikeAndUnlikeBook } = require("../middlewares/validateMiddleware");

router.use(authenticateToken);

router.post("/:bookId", validateLikeAndUnlikeBook, likeAndUnlikeBook);
// router.delete("/:bookId", authenticateToken, likeAndUnlikeBook);

module.exports = router;
