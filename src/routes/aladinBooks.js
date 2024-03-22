const express = require("express");
const router = express.Router();

const { authenticateToken, refreshAccessToken } = require("../middlewares/authMiddleware");
const { getAladinBookItem, getAladinBookList } = require("../controllers/aladinBooksController");

router.get("/list", getAladinBookList);
router.get("/item", authenticateToken, refreshAccessToken, getAladinBookItem);

module.exports = router;
