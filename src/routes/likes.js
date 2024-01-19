const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middlewares/authMiddleware");
const { likeAndUnlikeBook } = require("../controllers/likesController");

router.use(authenticateToken);
router.post("/:bookId", likeAndUnlikeBook);
// router.delete("/:bookId", authenticateToken, likeAndUnlikeBook);

module.exports = router;
