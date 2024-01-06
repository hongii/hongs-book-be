const express = require("express");
const router = express.Router();
router.use(express.json());

const { getBooksInfo, getBookDetail } = require("../controller/bookController");
const validate = require("../middleware/validationMiddleware");

router.get("/", getBooksInfo);
router.get("/:bookId", getBookDetail);

module.exports = router;
