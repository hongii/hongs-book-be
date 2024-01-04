const conn = require("../../mariadb").promise();
const { validationResult } = require("express-validator");
const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");

/* 전체 도서 조회 */
const getTotalBooks = (req, res) => {};

/* 개별 도서 조회 */
const getBookInfo = (req, res) => {};

/* 카테고리 별 도서 목록 조회 */
const getCategoryBooks = (req, res) => {};
