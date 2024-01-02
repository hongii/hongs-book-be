// get the client
const mysql = require("mysql2");

// create the connection to database
const connection = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  port: 3305,
  password: "root",
  database: "BookShop",
  dateStrings: true,
});

module.exports = connection;
