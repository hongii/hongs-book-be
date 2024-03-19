const conn = require("../../database/mariadb").promise();
const { snakeToCamelData } = require("../utils/convertSnakeToCamel");
const { CustomError, ERROR_MESSAGES } = require("../middlewares/errorHandlerMiddleware");

const RESPONSE_MESSAGES = {
  ADD_TO_CART: "장바구니에 추가되었습니다.",
  EMPTY_CART: "장바구니 목록이 비어있습니다.",
  CHANGE_CART_ITEM_QUANTITY: "수량을 변경하였습니다.",
};

const addTocartService = async (bookId, quantity, userId) => {
  let sql = "SELECT * FROM books WHERE id=?";
  let [results] = await conn.query(sql, [bookId]);
  if (results.length > 0) {
    // 동일한 물품이 장바구니에 존재하는지 확인
    sql = "SELECT * FROM cart_items WHERE user_id=? AND book_id=?";
    let values = [userId, bookId];
    let setQuantity = quantity;
    [results] = await conn.query(sql, values);

    if (results.length > 0) {
      // 동일한 물품이 있다면 수량만 수정함
      setQuantity += results[0].quantity;
      sql = "UPDATE cart_items SET quantity=? WHERE user_id=? AND book_id=?";
    } else {
      // 없다면 데이터 그대로 삽입
      sql = "INSERT INTO cart_items (quantity, user_id, book_id) VALUES(?, ?, ?)";
    }

    values = [setQuantity, userId, bookId];
    [results] = await conn.query(sql, values);
    if (results.affectedRows > 0) {
      sql = "SELECT count(*) as cnt FROM cart_items WHERE user_id=?";
      values = [userId];
      [results] = await conn.query(sql, values);
      return { data: { cartItemsCount: results[0].cnt }, message: RESPONSE_MESSAGES.ADD_TO_CART };
    }
    throw new CustomError(ERROR_MESSAGES.BAD_REQUEST);
  }

  throw new CustomError(ERROR_MESSAGES.BOOKS_NOT_FOUND);
};

const getCartItemsService = async (cartItemIds, userId) => {
  // 장바구니 전체 목록 조회
  const sql = `SELECT c.id AS cart_item_id, c.book_id, b.title, b.summary, b.price, b.img_url, c.quantity 
              FROM cart_items AS c INNER JOIN books AS b ON c.book_id = b.id 
              WHERE c.user_id=?`;
  const tailSql = " AND c.id IN (?)";
  let values = [userId];

  if (cartItemIds) {
    // 장바구니에서 선택한 물품 목록(주문 예상 물품 목록) 조회
    values.push(cartItemIds);

    const [selectedItemsResults] = await conn.query(sql + tailSql, values);
    if (selectedItemsResults.length === cartItemIds.length) {
      const items = snakeToCamelData(selectedItemsResults);
      return { data: { items }, message: null };
    }
    throw new CustomError(ERROR_MESSAGES.BAD_REQUEST);
  }

  const [results] = await conn.query(sql, values);
  if (results.length > 0) {
    const items = snakeToCamelData(results);
    return { data: { items }, message: null };
  }
  return { data: { items: [] }, message: RESPONSE_MESSAGES.EMPTY_CART };
};

const removeFromCartService = async (cartItemId, userId) => {
  const sql = `DELETE FROM cart_items WHERE user_id=? AND id=?`;
  const values = [userId, cartItemId];
  const [results] = await conn.query(sql, values);
  if (results.affectedRows > 0) {
    return null;
  }
  throw new CustomError(ERROR_MESSAGES.BAD_REQUEST);
};

const changeQuantityCartItemService = async (cartItemId, quantity, userId) => {
  const sql = `UPDATE cart_items SET quantity=? WHERE user_id=? AND id=?`;
  const values = [quantity, userId, cartItemId];
  const [results] = await conn.query(sql, values);
  if (results.affectedRows > 0) {
    return { message: RESPONSE_MESSAGES.CHANGE_CART_ITEM_QUANTITY };
  }
  throw new CustomError(ERROR_MESSAGES.BAD_REQUEST);
};

module.exports = {
  addTocartService,
  getCartItemsService,
  removeFromCartService,
  changeQuantityCartItemService,
};
