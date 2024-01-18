const conn = require("../../mariadb").promise();
const { StatusCodes } = require("http-status-codes");
const { sqlError, serverError } = require("../utils/errorHandler");
const { snakeToCamelData } = require("../utils/convertSnakeToCamel");

/* 장바구니에 담기 */
const addTocart = async (req, res) => {
  try {
    let { book_id: bookId, quantity } = req.body;
    const { id: userId } = req.user;

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
      return res.status(StatusCodes.CREATED).json({ message: "장바구니에 추가되었습니다." });
    }
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "해당 도서 id는 존재하지 않습니다. 확인 후 다시 입력해주세요." });
  } catch (err) {
    if (err.code && err.code.startsWith("ER_")) {
      sqlError(res, err);
    } else {
      serverError(res, err);
    }
  }
};

/* 장바구니 목록 조회 */
const getCartItems = async (req, res) => {
  try {
    const { selected: cartItemIds } = req.body;
    const { id: userId } = req.user;

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
      if (results.length > 0) {
        const items = snakeToCamelData(results);
        return res.status(StatusCodes.OK).json({ data: { items } });
      }
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "잘못된 정보를 입력하였습니다. 확인 후 다시 입력해주세요." });
    }

    const [results] = await conn.query(sql, values);
    if (results.length > 0) {
      const items = snakeToCamelData(results);
      return res.status(StatusCodes.OK).json({ data: { items } });
    }
    return res.status(StatusCodes.OK).json({ message: "장바구니 목록이 비어있습니다." });
  } catch (err) {
    if (err.code && err.code.startsWith("ER_")) {
      sqlError(res, err);
    } else {
      serverError(res, err);
    }
  }
};

/* 장바구니에서 물품 제거 */
const removeFromCart = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { bookId } = req.params;

    const sql = `DELETE FROM cart_items WHERE user_id=? AND book_id=?`;
    const values = [+userId, +bookId];
    const [results] = await conn.query(sql, values);
    if (results.affectedRows > 0) {
      return res.status(StatusCodes.NO_CONTENT).json();
    }
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "장바구니에 해당 도서가 담겨있지 않습니다. 다시 입력해주세요." });
  } catch (err) {
    if (err.code && err.code.startsWith("ER_")) {
      sqlError(res, err);
    } else {
      serverError(res, err);
    }
  }
};

module.exports = { addTocart, getCartItems, removeFromCart };
