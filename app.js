const express = require("express");
const app = express();

const dotenv = require("dotenv");
dotenv.config();

const usersRouter = require("./routes/users");
const booksRouter = require("./routes/books");
const cartsRouter = require("./routes/carts");
const likesRouter = require("./routes/likes");
const ordersRouter = require("./routes/orders");

app.use("/api/users", usersRouter);
app.use("/api/books", booksRouter);
app.use("/api/carts", cartsRouter);
app.use("/api/likes", likesRouter);
app.use("/api/orders", ordersRouter);

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Success! Listening on port : ${port}`);
});
