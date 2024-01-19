const conn = require("../../database/mariadb").promise();
const { StatusCodes } = require("http-status-codes");
const { snakeToCamelData } = require("../utils/convertSnakeToCamel");
const { CustomError } = require("../middlewares/errorHandlerMiddleware");

const addTocartService = async (bookId, quantity, userId) => {
  let sql = "SELECT * FROM books WHERE id=?";
  const [results] = await conn.query(sql, bookId);
  if (results.length > 0) {
    // 동일한 물품이 장바구니에 존재하는지 확인
    sql = "SELECT * FROM cart_items WHERE user_id=? AND book_id=?";
    let values = [+userId, +bookId];
    const [results] = await conn.query(sql, values);
    if (results.length > 0) {
      // 동일한 물품이 있다면 수량만 수정함
      quantity = parseInt(quantity) + results[0].quantity;
      sql = "UPDATE cart_items SET quantity=? WHERE user_id=? AND book_id=?";
    } else {
      // 없다면 데이터 그대로 삽입
      sql = "INSERT INTO cart_items (quantity, user_id, book_id) VALUES(?, ?, ?)";
    }
    values = [+quantity, +userId, +bookId];
    await conn.query(sql, values);
    return { message: "장바구니에 추가되었습니다." };
  }
  throw new CustomError(
    "해당 도서 id는 존재하지 않습니다. 확인 후 다시 입력해주세요.",
    StatusCodes.NOT_FOUND,
  );
};

const getCartItemsService = async (cartItemIds, userId) => {
  /* 장바구니 전체 목록 조회 */
  let sql = `SELECT c.id AS cart_item_id, c.book_id, b.title, b.summary, b.price, c.quantity 
              FROM cart_items AS c INNER JOIN books AS b ON c.book_id = b.id 
              WHERE c.user_id=?`;
  const tailSql = " AND c.id IN (?)";
  let values = [+userId];

  if (cartItemIds) {
    /* 장바구니에서 선택한 물품 목록(주문 예상 물품 목록) 조회 */
    values.push(cartItemIds);

    const [results] = await conn.query(sql + tailSql, values);
    if (results.length === cartItemIds.length) {
      const items = snakeToCamelData(results);
      return { data: { items } };
    }
    throw new CustomError("잘못된 요청입니다. 확인 후 다시 시도해주세요.", StatusCodes.BAD_REQUEST);
  }

  const [selectedItemsResults] = await conn.query(sql, values);
  if (selectedItemsResults.length > 0) {
    const items = snakeToCamelData(selectedItemsResults);
    return { data: { items } };
  }
  return { data: null };
};

const removeFromCartService = async (bookId, userId) => {
  const sql = `DELETE FROM cart_items WHERE user_id=? AND book_id=?`;
  const values = [+userId, +bookId];
  const [results] = await conn.query(sql, values);
  if (results.affectedRows > 0) {
    return null;
  }
  throw new CustomError(
    "장바구니에 해당 도서가 담겨있지 않습니다. 다시 입력해주세요.",
    StatusCodes.NOT_FOUND,
  );
};

module.exports = {
  addTocartService,
  getCartItemsService,
  removeFromCartService,
};
