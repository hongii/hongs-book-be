const conn = require("../../database/mariadb").promise();
const { StatusCodes } = require("http-status-codes");
const { snakeToCamelData } = require("../utils/convertSnakeToCamel");
const { CustomError } = require("../middlewares/errorHandlerMiddleware");

const requestPaymentService = async (
  items,
  delivery,
  totalQuantity,
  totalPrice,
  mainBookTitle,
  userId,
) => {
  // 트랜잭션 시작
  await conn.beginTransaction();

  let sql = "INSERT INTO deliveries (address, receiver, contact) VALUES(?, ?, ?)";
  let values = [delivery.address, delivery.receiver, delivery.contact];
  const [insertDeliveriesResults] = await conn.query(sql, values);

  const deleveryId = insertDeliveriesResults.insertId;
  sql = `INSERT INTO orders (delivery_id, user_id, main_book_title, total_price, total_quantity) 
              VALUES(?, ?, ?, ?, ?)`;
  values = [deleveryId, userId, mainBookTitle, totalPrice, totalQuantity];
  const [insertOrdersResults] = await conn.query(sql, values);

  const orderId = insertOrdersResults.insertId;
  sql = `INSERT INTO ordered_books (order_id, book_id, quantity) VALUES ?`; // MULTI-INSERT
  values = [];
  for (let i = 0; i < items.length; i++) {
    values.push([orderId, items[i].bookId, items[i].quantity]);
  }
  const [insertOrederedBookresults] = await conn.query(sql, [values]);
  if (insertOrederedBookresults.affectedRows === 0) {
    await conn.rollback(); // 트랜잭션 롤백
    throw new CustomError("결제 진행 중 오류가 발생했습니다.", StatusCodes.BAD_REQUEST);
  }
  // 주문한 상품은 장바구니에서 삭제하기
  const itemIds = items.map((obj) => obj.cartItemId);
  sql = "DELETE FROM cart_items WHERE id IN(?)";
  const [deleteResults] = await conn.query(sql, [itemIds]);
  if (deleteResults.affectedRows !== items.length) {
    await conn.rollback(); // 트랜잭션 롤백
    throw new CustomError("결제 진행 중 오류가 발생했습니다.", StatusCodes.BAD_REQUEST);
  }

  // 트랜잭션 커밋 완료
  await conn.commit();
  return { message: "주문이 완료되었습니다." };
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
    return { data: { orders } };
  }
  return { data: null };
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
    const orderDetail = snakeToCamelData(results);
    return { data: { orderDetail } };
  }
  throw new CustomError("잘못된 요청입니다. 확인 후 다시 시도해주세요.", StatusCodes.BAD_REQUEST);
};

module.exports = { requestPaymentService, getOrderListService, getOrderListDetailsService };
