const conn = require("../../mariadb").promise();
const { StatusCodes } = require("http-status-codes");
const { sqlError, serverError } = require("../utils/errorHandler");

/* 주문(결제) 요청 */
const requestPayment = async (req, res) => {
  try {
    let {
      items,
      delivery,
      total_quantity: totalQuantity,
      total_price: totalPrice,
      main_book_title: mainBookTitle,
      user_id: userId,
    } = req.body;

    // 추후, jwt토큰 유효성 검증을 통해 인증된 사용자인지 확인하는 로직 추가할 예정
    // 일단은 body로 들어오는 user_id는 항상 유효한 값이라고 가정

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
    // MULTI-INSERT
    sql = `INSERT INTO ordered_books (order_id, book_id, quantity) VALUES ?`;
    values = [];
    for (let i = 0; i < items.length; i++) {
      values.push([orderId, items[i].book_id, items[i].quantity]);
    }
    await conn.query(sql, [values]);

    // 트랜잭션 커밋 완료
    await conn.commit();

    return res.status(StatusCodes.OK).json({ message: "주문이 완료되었습니다." });
  } catch (err) {
    if (err.code && err.code.startsWith("ER_")) {
      console.error("transaction rollback");
      await conn.rollback(); // 트랜잭션 롤백
      sqlError(res, err);
    } else {
      serverError(res, err);
    }
  }
};

/* 주문 내역 조회 */
const getOrderList = async (req, res) => {};

/* 주문 내역의 상품 상세 조회 */
const getOrderListDetails = async (req, res) => {};

module.exports = { requestPayment, getOrderList, getOrderListDetails };
