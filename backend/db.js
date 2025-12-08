const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost', // Hoặc 127.0.0.1
  user: 'root', // User MySQL của bạn
  password: 'ironman2412', // Mật khẩu MySQL của bạn
  database: 'quan_ly_thu_vien', // Tên database bạn đã tạo
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('Đã tạo pool kết nối MySQL!');

module.exports = pool;