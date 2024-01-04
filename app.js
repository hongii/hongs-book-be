const express = require("express");
const app = express();

const dotenv = require("dotenv");
dotenv.config();

const usersRouter = require("./src/routes/users");
const booksRouter = require("./src/routes/books");
const cartsRouter = require("./src/routes/carts");
const likesRouter = require("./src/routes/likes");
const ordersRouter = require("./src/routes/orders");

app.use("/api/users", usersRouter);
app.use("/api/books", booksRouter);
app.use("/api/carts", cartsRouter);
app.use("/api/likes", likesRouter);
app.use("/api/orders", ordersRouter);

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Success! Listening on port : ${port}`);
});
