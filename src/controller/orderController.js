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
    } = req.body;
    const { id: userId } = req.user;

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

    // 주문한 상품은 장바구니에서 삭제하기
    const itemIds = items.map((obj) => obj.cart_item_id);
    sql = "DELETE FROM cart_items WHERE id IN(?)";
    await conn.query(sql, [itemIds]);

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

/* 전체 주문 내역 조회 */
const getOrderList = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const sql = `
      SELECT o.id AS order_id, o.created_at, o.main_book_title, o.total_quantity, o.total_price, d.address, d.receiver, d.contact 
      FROM orders AS o INNER JOIN deliveries AS d ON o.delivery_id=d.id
      WHERE o.user_id=?`;
    const values = [+userId];
    const [results] = await conn.query(sql, values);
    if (results.length > 0) {
      const deliveryKeys = ["address", "receiver", "contact"];
      const data = results.map((obj) => {
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

      return res.status(StatusCodes.OK).json({ data });
    }

    return res.status(StatusCodes.NOT_FOUND).json({ message: "주문 내역이 없습니다." });
  } catch (err) {
    if (err.code && err.code.startsWith("ER_")) {
      sqlError(res, err);
    } else {
      serverError(res, err);
    }
  }
};

/* 주문 내역의 상품 상세 조회 */
const getOrderListDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { id: userId } = req.user;

    let sql = `SELECT * FROM orders WHERE id=? AND user_id=?`; // 사용자 확인은 jwt유효성 검증으로 바꿀예정
    const values = [+orderId, +userId];
    const [results] = await conn.query(sql, values);
    if (results.length > 0) {
      sql = `SELECT o.book_id, b.title, b.author, b.price, o.quantity 
            FROM ordered_books AS o INNER JOIN books AS b ON o.book_id=b.id 
            WHERE order_id =?`;
      const [results] = await conn.query(sql, +orderId);
      return res.status(StatusCodes.OK).json({ data: results });
    }

    return res.status(StatusCodes.NOT_FOUND).json({ message: "주문 내역이 없습니다." });
  } catch (err) {
    if (err.code && err.code.startsWith("ER_")) {
      sqlError(res, err);
    } else {
      serverError(res, err);
    }
  }
};

module.exports = { requestPayment, getOrderList, getOrderListDetails };
