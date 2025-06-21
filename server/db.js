const mysql = require('mysql2/promise');

const dotenv = require('dotenv');

dotenv.config();
console.log(process.env.DB_HOST);

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', // 读取环境变量
  database: process.env.DB_NAME || 'milkywayidle',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
