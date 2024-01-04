const express = require("express");
const router = express.Router();
router.use(express.json());

const getAllCategories = require("../controller/categoryController");
const validate = require("../middleware/validationMiddleware");

router.get("/", getAllCategories);

module.exports = router;
