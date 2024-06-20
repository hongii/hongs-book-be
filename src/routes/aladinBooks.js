const express = require("express");
const router = express.Router();

const { authenticateToken, refreshAccessToken } = require("../middlewares/authMiddleware");
const {
  getAladinBookItem,
  getAladinBookList,
  getSearchAladinBooks,
} = require("../controllers/aladinBooksController");

router.get("/list", getAladinBookList);
router.get("/item", authenticateToken, refreshAccessToken, getAladinBookItem);
router.get("/search", getSearchAladinBooks);

module.exports = router;
