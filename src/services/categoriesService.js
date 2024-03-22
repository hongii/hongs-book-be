const conn = require("../../database/mariadb").promise();
const { snakeToCamelData } = require("../utils/convert");

const RESPONSE_MESSAGES = {
  EMPTY_CATEGORY_LIST: "카테고리 목록이 비어있습니다.",
};

const getAllCategoriesService = async () => {
  const sql = `SELECT * FROM categories`;
  const [results] = await conn.query(sql);
  if (results.length > 0) {
    const categories = snakeToCamelData(results);
    return { data: { categories }, message: null };
  }
  return { data: { categories: [] }, message: RESPONSE_MESSAGES.EMPTY_CATEGORY_LIST };
};

module.exports = { getAllCategoriesService };
