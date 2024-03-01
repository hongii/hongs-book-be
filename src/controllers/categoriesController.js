const { StatusCodes } = require("http-status-codes");
const { asyncWrapper } = require("../middlewares/asyncWrapperMiddleware");
const { getAllCategoriesService } = require("../services/categoriesService");

/* 카테고리 전체 목록 조회 */
const getAllCategories = async (req, res) => {
  const { data, message } = await getAllCategoriesService();
  return res.status(StatusCodes.OK).json({ ...data, message });
};

module.exports = { getAllCategories: asyncWrapper(getAllCategories) };
