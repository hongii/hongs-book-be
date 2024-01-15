const express = require("express");
const router = express.Router();
router.use(express.json());

const { getBooksInfo, getBookDetail } = require("../controller/bookController");
const authenticateToken = require("../middleware/auth");

router.get("/", getBooksInfo);
router.get("/:bookId", authenticateToken, getBookDetail);

module.exports = router;
