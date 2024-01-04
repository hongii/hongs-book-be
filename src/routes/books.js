const express = require("express");
const router = express.Router();
router.use(express.json());

const { getBooks, getBookInfo } = require("../controller/bookController");
const validate = require("../middleware/validationMiddleware");

router.get("/", getBooks);
router.get("/:bookId", getBookInfo);

module.exports = router;
