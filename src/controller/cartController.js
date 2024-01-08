const conn = require("../../mariadb").promise();
const { StatusCodes } = require("http-status-codes");
const { sqlError, serverError } = require("../utils/errorHandler");

/* 장바구니에 담기 */
const addTocart = async (req, res) => {
  try {
    let { user_id: userId, book_id: bookId, quantity } = req.body;

    // 추후, jwt토큰 유효성 검증을 통해 인증된 사용자인지 확인하는 로직 추가할 예정
    // 일단은 body로 들어오는 user_id는 항상 유효한 값이라고 가정

    let sql = "SELECT * FROM books WHERE id=?";
    const [results] = await conn.query(sql, bookId);
    if (results.length > 0) {
      // 동일한 물품이 장바구니에 존재하는지 확인
      sql = "SELECT * FROM cart_items WHERE user_id=? AND book_id=?";
      let values = [userId, bookId];
      const [results] = await conn.query(sql, values);
      if (results.length > 0) {
        // 동일한 물품이 있다면 수량만 수정함
        quantity = parseInt(quantity) + results[0].quantity;
        sql = "UPDATE cart_items SET quantity=? WHERE user_id=? AND book_id=?";
        values = [quantity, userId, bookId];
        await conn.query(sql, values);
      } else {
        // 없다면 데이터 그대로 삽입
        sql = "INSERT INTO cart_items (quantity, user_id, book_id) VALUES(?, ?, ?)";
        values = [quantity, userId, bookId];
        await conn.query(sql, values);
      }

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
const getCartItems = async (req, res) => {};

/* 장바구니에서 물품 제거 */
const removeFromCart = async (req, res) => {};

/* 장바구니에서 선택한 물품 목록(주문 예상 물품 목록) 조회 */
const getselectedItem = async (req, res) => {};

module.exports = { addTocart, getCartItems, removeFromCart, getselectedItem };
