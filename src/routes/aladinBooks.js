const express = require("express");
const router = express.Router();

const { getAladinBookItem, getAladinBookList } = require("../controllers/aladinBooksController");

router.get("/list", getAladinBookList);
router.get("/item", getAladinBookItem);

module.exports = router;
