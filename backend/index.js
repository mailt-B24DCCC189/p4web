
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // Để mã hóa mật khẩu
const jwt = require('jsonwebtoken'); // Để tạo token
const pool = require('./db'); // Import kết nối DB
const authMiddleware = require('./authMiddleware'); // Import "người gác cổng"
let quanLySachController, statisticsController, borrowController, readersController;

try {
  quanLySachController = require('./quanLySachController');
  console.log('✅ QuanLySachController loaded');
} catch (error) {
  console.error('❌ Error loading quanLySachController:', error.message);
  process.exit(1);
}

try {
  statisticsController = require('./controllers/statisticsController');
  console.log('✅ StatisticsController loaded');
} catch (error) {
  console.error('❌ Error loading statisticsController:', error.message);
  process.exit(1);
}

try {
  borrowController = require('./controllers/borrowController');
  console.log('✅ BorrowController loaded');
  console.log('Available methods:', Object.keys(borrowController));
} catch (error) {
  console.error('❌ Error loading borrowController:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

try {
  readersController = require('./controllers/readersController');
  console.log('✅ ReadersController loaded');
  console.log('Available methods:', Object.keys(readersController));
} catch (error) {
  console.error('❌ Error loading readersController:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

const app = express();
const PORT = 8080; // Cổng backend sẽ chạy

app.use(cors({
  origin: 'http://localhost:3000'
}));

app.use(express.json());

const MY_SECRET_KEY = 'lap-trinh-web-nang-cao-bi-mat';


app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email, full_name } = req.body;

    const [existingUser] = await pool.query(
      'SELECT * FROM Users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Username hoặc email đã tồn tại' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      'INSERT INTO Users (username, password_hash, email, full_name) VALUES (?, ?, ?, ?)',
      [username, password_hash, email, full_name]
    );

    res.status(201).json({ message: 'Tạo tài khoản thành công', userId: result.insertId });
  } catch (err) {
    console.error('Lỗi khi đăng ký:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const [rows] = await pool.query('SELECT * FROM Users WHERE username = ?', [username]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ message: 'Sai tên đăng nhập hoặc mật khẩu' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: 'Sai tên đăng nhập hoặc mật khẩu' });
    }

    const payload = {
      userId: user.user_id,
      username: user.username,
      full_name: user.full_name,
      role: user.role // Giả sử bạn có cột 'role'
    };
    
    const token = jwt.sign(payload, MY_SECRET_KEY, { expiresIn: '1h' }); // Token sống 1 giờ

    res.json({
      message: 'Đăng nhập thành công',
      token: token,
      user: payload
    });

  } catch (err) {
    console.error('Lỗi khi đăng nhập:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  
  const [rows] = await pool.query('SELECT user_id, username, email, full_name FROM Users WHERE user_id = ?', [userId]);
  
  res.json({ 
    message: 'Bạn đã được xác thực', 
    user: rows[0] 
  });
});

app.get('/api/books', quanLySachController.layDanhSachSach);

app.get('/api/categories', quanLySachController.layDanhSachTheLoai);

app.post('/api/books', authMiddleware, quanLySachController.themSachMoi);

app.put('/api/books/:id', authMiddleware, quanLySachController.capNhatSach);

app.delete('/api/books/:id', authMiddleware, quanLySachController.xoaSach);

app.get('/api/statistics/overview', statisticsController.getOverview);
app.get('/api/statistics/recent-activities', statisticsController.getRecentActivities);

app.get('/api/statistics/most-borrowed-books', statisticsController.getMostBorrowedBooks);

app.get('/api/statistics/most-borrowing-readers', statisticsController.getMostBorrowingReaders);

app.get('/api/statistics/borrow-trends', statisticsController.getBorrowTrends);

app.get('/api/statistics/stock-status', statisticsController.getStockStatus);

app.get('/api/statistics/overdue-books', statisticsController.getOverdueBooks);

app.get('/api/statistics/category-stats', statisticsController.getCategoryStats);

app.get('/api/statistics/time-stats', statisticsController.getTimeStats);

app.get('/api/borrows/current', statisticsController.getCurrentBorrows);

app.get('/api/borrows/overdue', statisticsController.getOverdueBorrows);

app.post('/api/borrows', borrowController.createBorrow);

app.get('/api/borrows', borrowController.getAllBorrows);

app.get('/api/borrows/:id', borrowController.getBorrowById);

app.put('/api/borrows/:id', borrowController.updateBorrow);

app.put('/api/borrows/:id/return', borrowController.returnBook);

app.put('/api/borrows/:id/extend', borrowController.extendBorrow);

app.delete('/api/borrows/:id', borrowController.deleteBorrow);

app.get('/api/readers', readersController.getAllReaders);

app.post('/api/readers', authMiddleware, readersController.createReader);

app.get('/api/readers/:id', authMiddleware, readersController.getReaderById);

app.put('/api/readers/:id', authMiddleware, readersController.updateReader);

app.delete('/api/readers/:id', authMiddleware, readersController.deleteReader);

app.listen(PORT, () => {
  console.log(`✅ Backend server đang chạy ở http://localhost:${PORT}`);
  console.log(`✅ API endpoints available at http://localhost:${PORT}/api`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} đã được sử dụng. Vui lòng đóng ứng dụng khác hoặc đổi port.`);
  } else {
    console.error('❌ Lỗi khi khởi động server:', err);
  }
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});