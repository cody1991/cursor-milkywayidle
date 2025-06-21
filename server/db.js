const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root', // 修改为你的MySQL用户名
  password: 'cody1991', // 修改为你的MySQL密码
  database: 'milkywayidle',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
