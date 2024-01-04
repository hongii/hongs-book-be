const express = require("express");
const router = express.Router();
router.use(express.json());

const { getTotalBooks, getBookInfo, getCategoryBooks } = require("../controller/bookController");
const validate = require("../middleware/validationMiddleware");

router.get("/", getCategoryBooks);
router.get("/", getTotalBooks);
router.get("/:bookId", getBookInfo);

module.exports = router;
