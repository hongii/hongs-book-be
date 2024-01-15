const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: process.env.MARIADB_HOST,
  user: process.env.MARIADB_USER,
  port: process.env.MARIADB_PORT,
  password: process.env.MARIADB_PASSWORD,
  database: process.env.MARIADB_DATABASE,
  dateStrings: true,
});

module.exports = connection;
