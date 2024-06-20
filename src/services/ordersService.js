const conn = require("../../database/mariadb").promise();
const { snakeToCamelData } = require("../utils/convert");
const { CustomError, ERROR_MESSAGES } = require("../middlewares/errorHandlerMiddleware");

const RESPONSE_MESSAGES = {
  ORDER_SUCCESS: "주문이 완료되었습니다.",
  EMPTY_ORDER_LIST: "주문 내역이 없습니다.",
};

const checkDataMatch = async (conn, items, itemIds, userId, totalQuantity) => {
  const sql = `SELECT * FROM cart_items WHERE user_id=? AND id IN (?)`;
  const values = [userId, itemIds];
  const [checkResults] = await conn.query(sql, values);
  if (checkResults.length !== itemIds.length) {
    throw new CustomError(ERROR_MESSAGES.CART_DATA_MISMATCH);
  }

  const requestItems = [...items].sort((obj1, obj2) => obj1.cartItemId - obj2.cartItemId);
  requestItems.sort((obj1, obj2) => obj1.cartItemId - obj2.cartItemId);
  for (let i = 0; i < itemIds.length; i++) {
    const { cartItemId, bookId, quantity } = requestItems[i];
    if (
      checkResults[i].id !== cartItemId ||
      checkResults[i].book_id !== bookId ||
      checkResults[i].quantity !== quantity
    ) {
      throw new CustomError(ERROR_MESSAGES.CART_DATA_MISMATCH);
    }
  }

  const checkTotalQuantity = checkResults.reduce((acc, obj) => acc + obj.quantity, 0);
  if (checkTotalQuantity !== totalQuantity) {
    throw new CustomError(ERROR_MESSAGES.CART_DATA_MISMATCH);
  }
};

const requestPaymentService = async (
  items,
  delivery,
  totalQuantity,
  totalPrice,
  mainBookTitle,
  userId,
) => {
  try {
    await conn.beginTransaction();

    // DB의 cart_items에 저장되어 있는 데이터와 요청 받은 정보가 일치하는지 확인하는 작업 선행
    const itemIds = items.map((obj) => obj.cartItemId);
    await checkDataMatch(conn, items, itemIds, userId, totalQuantity);

    sql = `INSERT INTO deliveries (address, receiver, contact) VALUES(?, ?, ?)`;
    values = [delivery.address, delivery.receiver, delivery.contact];
    const [insertDeliveriesResults] = await conn.query(sql, values);

    const deliveryId = insertDeliveriesResults?.insertId;
    sql = `INSERT INTO orders (delivery_id, user_id, main_book_title, total_price, total_quantity) 
              VALUES(?, ?, ?, ?, ?)`;
    values = [deliveryId, userId, mainBookTitle, totalPrice, totalQuantity];
    const [insertOrdersResults] = await conn.query(sql, values);

    const orderId = insertOrdersResults?.insertId;
    sql = `INSERT INTO ordered_books (order_id, book_id, quantity) VALUES ?`; // MULTI-INSERT
    values = items.map((obj) => [orderId, obj.bookId, obj.quantity]);
    await conn.query(sql, [values]);

    // 주문한 상품은 장바구니에서 삭제하기
    sql = "DELETE FROM cart_items WHERE id IN(?)";
    const [deleteResults] = await conn.query(sql, [itemIds]);
    if (deleteResults.affectedRows !== items.length) {
      throw new CustomError(ERROR_MESSAGES.ORDER_ERROR);
    }

    await conn.commit();

    return { message: RESPONSE_MESSAGES.ORDER_SUCCESS };
  } catch (err) {
    await conn.rollback();
    throw new CustomError(err.message);
  }
};

const getOrderListService = async (userId) => {
  const sql = `
      SELECT o.id AS order_id, o.created_at, o.main_book_title, o.total_quantity, o.total_price, d.address, d.receiver, d.contact 
      FROM orders AS o INNER JOIN deliveries AS d ON o.delivery_id=d.id
      WHERE o.user_id=?`;
  const values = [userId];
  const [results] = await conn.query(sql, values);
  if (results.length > 0) {
    let orders = snakeToCamelData(results);
    const deliveryKeys = ["address", "receiver", "contact"];
    orders = results.map((obj) => {
      const delivery = {};
      const newObj = {};

      Object.keys(obj).forEach((key) => {
        if (!deliveryKeys.includes(key)) {
          newObj[key] = obj[key];
        } else {
          delivery[key] = obj[key];
        }
      });
      return { ...newObj, delivery };
    });
    return { data: { orders }, message: null };
  }
  return { data: {}, message: RESPONSE_MESSAGES.EMPTY_ORDER_LIST };
};

const getOrderListDetailsService = async (orderId, userId) => {
  let sql = `SELECT * FROM orders WHERE id=? AND user_id=?`;
  const values = [orderId, userId];
  const [results] = await conn.query(sql, values);
  if (results.length > 0) {
    sql = `SELECT o.book_id, b.title, b.author, b.price_standard, b.cover, b.form, o.quantity 
            FROM ordered_books AS o INNER JOIN aladin_books AS b ON o.book_id=b.item_id 
            WHERE order_id =?`;
    const [results] = await conn.query(sql, orderId);
    if (results.length > 0) {
      const orderDetail = snakeToCamelData(results);
      return { data: { orderDetail } };
    }
  }
  throw new CustomError(ERROR_MESSAGES.BAD_REQUEST);
};

module.exports = { requestPaymentService, getOrderListService, getOrderListDetailsService };
