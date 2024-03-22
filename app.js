const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT;

const usersRouter = require("./src/routes/users");
const aladinBooksRouter = require("./src/routes/aladinBooks");
const booksRouter = require("./src/routes/books");
const cartsRouter = require("./src/routes/carts");
const likesRouter = require("./src/routes/likes");
const ordersRouter = require("./src/routes/orders");
const categoriesRouter = require("./src/routes/categories");
const { errorHandler, handleNotFound } = require("./src/middlewares/errorHandlerMiddleware");

const corsOptions = {
  origin: process.env.ORIGIN,
  credentials: true,
  exposedHeaders: ["Authorization"],
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());

app.use("/api/aladin", aladinBooksRouter);
app.use("/api/users", usersRouter);
app.use("/api/books", booksRouter);
app.use("/api/carts", cartsRouter);
app.use("/api/likes", likesRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/categories", categoriesRouter);
app.use("*", handleNotFound);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Success! Listening on port : ${port}`);
});
