const conn = require("../../database/mariadb").promise();
const { StatusCodes } = require("http-status-codes");
const { snakeToCamelData } = require("../utils/convertSnakeToCamel");
const { CustomError, ERROR_MESSAGES } = require("../middlewares/errorHandlerMiddleware");

const RESPONSE_MESSAGES = {
  ORDER_SUCCESS: "주문이 완료되었습니다.",
  EMPTY_ORDER_LIST: "주문 내역이 없습니다.",
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
    // 트랜잭션 시작
    await conn.beginTransaction();

    // DB의 cart_items 담긴 정보와 요청 받은 정보가 일치하는지 확인하는 작업 선행
    let sql = `SELECT * FROM cart_items WHERE id IN (?)`;
    const itemIds = items.map((obj) => obj.cartItemId);
    const [checkResults] = await conn.query(sql, [itemIds]);
    if (checkResults.length === itemIds.length) {
      const requestItems = [];
      items.sort((obj1, obj2) => obj1.cartItemId - obj2.cartItemId);
      for (let i = 0; i < items.length; i++) {
        requestItems.push([items[i].cartItemId, userId, items[i].bookId, items[i].quantity]);
      }

      for (let i = 0; i < itemIds.length; i++) {
        if (
          checkResults[i].id !== requestItems[i][0] ||
          checkResults[i].user_id !== requestItems[i][1] ||
          checkResults[i].book_id !== requestItems[i][2] ||
          checkResults[i].quantity !== requestItems[i][3]
        ) {
          throw new CustomError(" (장바구니 정보와 일치하지 않습니다.)", StatusCodes.BAD_REQUEST);
        }
      }

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
      values = [];
      for (let i = 0; i < items.length; i++) {
        values.push([orderId, items[i].bookId, items[i].quantity]);
      }
      const [insertOrederedBookresults] = await conn.query(sql, [values]);
      if (insertOrederedBookresults.affectedRows === 0) {
        await conn.rollback(); // 트랜잭션 롤백
        throw new CustomError(ERROR_MESSAGES.ORDER_ERROR, StatusCodes.BAD_REQUEST);
      }

      // 주문한 상품은 장바구니에서 삭제하기
      sql = "DELETE FROM cart_items WHERE id IN(?)";
      const [deleteResults] = await conn.query(sql, [itemIds]);
      if (deleteResults.affectedRows !== items.length) {
        await conn.rollback(); // 트랜잭션 롤백
        throw new CustomError(ERROR_MESSAGES.ORDER_ERROR, StatusCodes.BAD_REQUEST);
      }

      // 트랜잭션 커밋 완료
      await conn.commit();
      return { message: RESPONSE_MESSAGES.ORDER_SUCCESS };
    }
    throw new CustomError(ERROR_MESSAGES.ORDER_ERROR, StatusCodes.BAD_REQUEST);
  } catch (err) {
    await conn.rollback(); // 트랜잭션 롤백
    if (err.message !== ERROR_MESSAGES.ORDER_ERROR) {
      err.message = ERROR_MESSAGES.ORDER_ERROR + err.message;
      throw new CustomError(err.message, StatusCodes.BAD_REQUEST);
    }

    throw new CustomError(ERROR_MESSAGES.ORDER_ERROR, StatusCodes.BAD_REQUEST);
  }
};

const getOrderListService = async (userId) => {
  const sql = `
      SELECT o.id AS order_id, o.created_at, o.main_book_title, o.total_quantity, o.total_price, d.address, d.receiver, d.contact 
      FROM orders AS o INNER JOIN deliveries AS d ON o.delivery_id=d.id
      WHERE o.user_id=?`;
  const values = [+userId];
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
  const values = [+orderId, +userId];
  const [results] = await conn.query(sql, values);
  if (results.length > 0) {
    sql = `SELECT o.book_id, b.title, b.author, b.price, o.quantity 
            FROM ordered_books AS o INNER JOIN books AS b ON o.book_id=b.id 
            WHERE order_id =?`;
    const [results] = await conn.query(sql, +orderId);
    if (results.length > 0) {
      const orderDetail = snakeToCamelData(results);
      return { data: { orderDetail } };
    }
  }
  throw new CustomError(ERROR_MESSAGES.BAD_REQUEST, StatusCodes.BAD_REQUEST);
};

module.exports = { requestPaymentService, getOrderListService, getOrderListDetailsService };
