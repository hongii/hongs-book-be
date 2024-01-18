const express = require("express");
const router = express.Router();

const getAllCategories = require("../controller/categoryController");

router.get("/", getAllCategories);

module.exports = router;
