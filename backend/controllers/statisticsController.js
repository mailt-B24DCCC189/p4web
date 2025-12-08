const pool = require('../db');

const StatisticsController = {
  
  getOverview: async (req, res) => {
    try {
      const [result] = await pool.query(`
        SELECT 
            (SELECT COUNT(*) FROM Books WHERE is_hidden = 0) AS total_books,
            (SELECT COUNT(*) FROM Readers) AS total_readers,
            -- Tổng đang mượn (chưa trả, kể cả quá hạn)
            (SELECT COUNT(*) FROM BorrowRecords br WHERE br.return_date IS NULL) AS total_borrowing,
            -- Quá hạn: chưa trả và due_date < hôm nay
            (SELECT COUNT(*) FROM BorrowRecords br WHERE br.return_date IS NULL AND br.due_date < CURDATE()) AS total_overdue,
            (SELECT COUNT(*) FROM BorrowRecords WHERE status = 'RETURNED') AS total_returned,
            (SELECT SUM(total_quantity) FROM Books WHERE is_hidden = 0) AS total_books_quantity,
            (SELECT SUM(available_quantity) FROM Books WHERE is_hidden = 0) AS total_available_quantity
      `);
      
      res.json(result[0]);
    } catch (err) {
      console.error('Lỗi khi lấy thống kê tổng quan:', err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  getRecentActivities: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;

      const [columns] = await pool.query(`SHOW COLUMNS FROM BorrowRecords LIKE 'created_at'`);
      if (!columns || columns.length === 0) {
        await pool.query(`
          ALTER TABLE BorrowRecords
          ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER status
        `);
      }

      const [activities] = await pool.query(`
        (
          SELECT 
            br.borrow_id,
            r.full_name AS reader_name,
            b.title AS book_title,
            COALESCE(br.created_at, br.borrow_date) AS activity_date,
            UNIX_TIMESTAMP(COALESCE(br.created_at, br.borrow_date)) AS activity_ts,
            'borrow' AS activity_type,
            'mượn sách' AS action_text
          FROM BorrowRecords br
          INNER JOIN Readers r ON br.reader_id = r.reader_id
          INNER JOIN Books b ON br.book_id = b.book_id
          WHERE br.borrow_date IS NOT NULL
        )
        UNION ALL
        (
          SELECT 
            br.borrow_id,
            r.full_name AS reader_name,
            b.title AS book_title,
            br.return_date AS activity_date,
            UNIX_TIMESTAMP(br.return_date) AS activity_ts,
            'return' AS activity_type,
            'đã trả sách' AS action_text
          FROM BorrowRecords br
          INNER JOIN Readers r ON br.reader_id = r.reader_id
          INNER JOIN Books b ON br.book_id = b.book_id
          WHERE br.return_date IS NOT NULL
        )
        ORDER BY activity_ts DESC, borrow_id DESC
        LIMIT ?
      `, [limit]);
      
      res.json(activities);
    } catch (err) {
      console.error('Lỗi khi lấy hoạt động gần đây:', err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  getMostBorrowedBooks: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      
      const [books] = await pool.query(`
        SELECT 
            b.book_id,
            b.title,
            b.author,
            c.name AS category_name,
            b.total_quantity,
            b.available_quantity,
            b.image_url,
            COUNT(br.borrow_id) AS borrow_count
        FROM Books b
        LEFT JOIN BorrowRecords br ON b.book_id = br.book_id
        LEFT JOIN Categories c ON b.category_id = c.category_id
        WHERE b.is_hidden = 0
        GROUP BY b.book_id, b.title, b.author, c.name, b.total_quantity, b.available_quantity, b.image_url
        ORDER BY borrow_count DESC
        LIMIT ?
      `, [limit]);
      
      res.json(books);
    } catch (err) {
      console.error('Lỗi khi lấy sách mượn nhiều nhất:', err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  getMostBorrowingReaders: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      
      const [readers] = await pool.query(`
        SELECT 
            r.reader_id,
            r.full_name,
            r.email,
            r.phone,
            COUNT(br.borrow_id) AS total_borrows,
            COUNT(CASE WHEN br.status = 'BORROWING' THEN 1 END) AS current_borrows,
            COUNT(CASE WHEN br.status = 'RETURNED' THEN 1 END) AS returned_borrows,
            COUNT(CASE WHEN br.status = 'OVERDUE' THEN 1 END) AS overdue_borrows
        FROM Readers r
        LEFT JOIN BorrowRecords br ON r.reader_id = br.reader_id
        GROUP BY r.reader_id, r.full_name, r.email, r.phone
        ORDER BY total_borrows DESC
        LIMIT ?
      `, [limit]);
      
      res.json(readers);
    } catch (err) {
      console.error('Lỗi khi lấy bạn đọc mượn nhiều nhất:', err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  getBorrowTrends: async (req, res) => {
    try {
      const period = req.query.period || 'week'; // week, month, day
      let query = '';
      
      if (period === 'week') {
        query = `
          SELECT 
              DATE(br.borrow_date) AS date,
              COUNT(CASE WHEN br.borrow_date IS NOT NULL THEN 1 END) AS borrows_count,
              COUNT(CASE WHEN br.return_date IS NOT NULL THEN 1 END) AS returns_count
          FROM BorrowRecords br
          WHERE br.borrow_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          GROUP BY DATE(br.borrow_date)
          ORDER BY date ASC
        `;
      } else if (period === 'month') {
        query = `
          SELECT 
              DATE_FORMAT(br.borrow_date, '%Y-%m') AS month,
              COUNT(CASE WHEN br.borrow_date IS NOT NULL THEN 1 END) AS borrows_count,
              COUNT(CASE WHEN br.return_date IS NOT NULL THEN 1 END) AS returns_count
          FROM BorrowRecords br
          WHERE br.borrow_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
          GROUP BY DATE_FORMAT(br.borrow_date, '%Y-%m')
          ORDER BY month ASC
        `;
      } else {
        query = `
          SELECT 
              DATE(br.borrow_date) AS date,
              COUNT(CASE WHEN br.borrow_date IS NOT NULL THEN 1 END) AS borrows_count,
              COUNT(CASE WHEN br.return_date IS NOT NULL THEN 1 END) AS returns_count
          FROM BorrowRecords br
          WHERE br.borrow_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
          GROUP BY DATE(br.borrow_date)
          ORDER BY date ASC
        `;
      }
      
      const [trends] = await pool.query(query);
      res.json(trends);
    } catch (err) {
      console.error('Lỗi khi lấy xu hướng mượn/trả:', err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  getStockStatus: async (req, res) => {
    try {
      const [overview] = await pool.query(`
        SELECT 
            COUNT(*) AS total_books,
            SUM(total_quantity) AS total_quantity,
            SUM(available_quantity) AS total_available,
            SUM(total_quantity - available_quantity) AS total_borrowed,
            ROUND(SUM(available_quantity) * 100.0 / NULLIF(SUM(total_quantity), 0), 2) AS availability_rate
        FROM Books
        WHERE is_hidden = 0
      `);
      
      const [lowStock] = await pool.query(`
        SELECT 
            b.book_id,
            b.title,
            b.author,
            c.name AS category_name,
            b.total_quantity,
            b.available_quantity,
            (b.total_quantity - b.available_quantity) AS borrowed_quantity
        FROM Books b
        LEFT JOIN Categories c ON b.category_id = c.category_id
        WHERE b.is_hidden = 0 
          AND b.available_quantity < 5
          AND b.available_quantity >= 0
        ORDER BY b.available_quantity ASC
      `);
      
      const [outOfStock] = await pool.query(`
        SELECT 
            b.book_id,
            b.title,
            b.author,
            c.name AS category_name,
            b.total_quantity,
            b.available_quantity
        FROM Books b
        LEFT JOIN Categories c ON b.category_id = c.category_id
        WHERE b.is_hidden = 0 
          AND b.available_quantity = 0
        ORDER BY b.title ASC
      `);
      
      const [byCategory] = await pool.query(`
        SELECT 
            c.category_id,
            c.name AS category_name,
            COUNT(b.book_id) AS book_count,
            SUM(b.total_quantity) AS total_quantity,
            SUM(b.available_quantity) AS available_quantity,
            ROUND(SUM(b.available_quantity) * 100.0 / NULLIF(SUM(b.total_quantity), 0), 2) AS availability_rate
        FROM Categories c
        LEFT JOIN Books b ON c.category_id = b.category_id AND b.is_hidden = 0
        GROUP BY c.category_id, c.name
        ORDER BY book_count DESC
      `);
      
      res.json({
        overview: overview[0],
        lowStock: lowStock,
        outOfStock: outOfStock,
        byCategory: byCategory
      });
    } catch (err) {
      console.error('Lỗi khi lấy tình trạng kho:', err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  getOverdueBooks: async (req, res) => {
    try {
      const [overdue] = await pool.query(`
        SELECT 
            br.borrow_id,
            br.borrow_date,
            br.due_date,
            br.return_date,
            DATEDIFF(CURDATE(), br.due_date) AS days_overdue,
            b.title AS book_title,
            b.author AS book_author,
            r.reader_id,
            r.full_name AS reader_name,
            r.email AS reader_email,
            r.phone AS reader_phone
        FROM BorrowRecords br
        INNER JOIN Books b ON br.book_id = b.book_id
        INNER JOIN Readers r ON br.reader_id = r.reader_id
        WHERE br.status = 'OVERDUE' 
           OR (br.status = 'BORROWING' AND br.due_date < CURDATE() AND br.return_date IS NULL)
        ORDER BY days_overdue DESC
      `);
      
      res.json(overdue);
    } catch (err) {
      console.error('Lỗi khi lấy sách quá hạn:', err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  getCategoryStats: async (req, res) => {
    try {
      const [stats] = await pool.query(`
        SELECT 
            c.category_id,
            c.name AS category_name,
            COUNT(DISTINCT b.book_id) AS total_books,
            COUNT(br.borrow_id) AS total_borrows,
            COUNT(DISTINCT br.reader_id) AS unique_readers
        FROM Categories c
        LEFT JOIN Books b ON c.category_id = b.category_id AND b.is_hidden = 0
        LEFT JOIN BorrowRecords br ON b.book_id = br.book_id
        GROUP BY c.category_id, c.name
        ORDER BY total_borrows DESC
      `);
      
      res.json(stats);
    } catch (err) {
      console.error('Lỗi khi lấy thống kê thể loại:', err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  getTimeStats: async (req, res) => {
    try {
      const year = parseInt(req.query.year) || new Date().getFullYear();
      
      const [monthlyStats] = await pool.query(`
        SELECT 
            MONTH(br.borrow_date) AS month,
            DATE_FORMAT(br.borrow_date, '%Y-%m') AS month_name,
            COUNT(CASE WHEN br.borrow_date IS NOT NULL THEN 1 END) AS borrows_count,
            COUNT(CASE WHEN br.return_date IS NOT NULL THEN 1 END) AS returns_count
        FROM BorrowRecords br
        WHERE YEAR(br.borrow_date) = ?
        GROUP BY MONTH(br.borrow_date), DATE_FORMAT(br.borrow_date, '%Y-%m')
        ORDER BY month ASC
      `, [year]);
      
      res.json({
        year: year,
        monthlyStats: monthlyStats
      });
    } catch (err) {
      console.error('Lỗi khi lấy thống kê thời gian:', err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  getAllReaders: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const offset = (page - 1) * limit;
      
      const searchPattern = `%${search}%`;
      
      const [readers] = await pool.query(`
        SELECT 
            r.reader_id,
            r.full_name,
            r.email,
            r.phone,
            r.address,
            r.max_quota,
            r.created_at,
            COUNT(DISTINCT br.borrow_id) AS total_borrows,
            COUNT(CASE WHEN br.status = 'BORROWING' THEN 1 END) AS current_borrows,
            COUNT(CASE WHEN br.status = 'RETURNED' THEN 1 END) AS returned_borrows,
            COUNT(CASE WHEN br.status = 'OVERDUE' THEN 1 END) AS overdue_borrows
        FROM Readers r
        LEFT JOIN BorrowRecords br ON r.reader_id = br.reader_id
        WHERE r.full_name LIKE ?
           OR r.email LIKE ?
           OR r.phone LIKE ?
        GROUP BY r.reader_id, r.full_name, r.email, r.phone, r.address, r.max_quota, r.created_at
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?
      `, [searchPattern, searchPattern, searchPattern, limit, offset]);
      
      const [countResult] = await pool.query(`
        SELECT COUNT(*) AS total
        FROM Readers
        WHERE full_name LIKE ?
           OR email LIKE ?
           OR phone LIKE ?
      `, [searchPattern, searchPattern, searchPattern]);
      
      res.json({
        readers: readers,
        pagination: {
          page: page,
          limit: limit,
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      });
    } catch (err) {
      console.error('Lỗi khi lấy danh sách thành viên:', err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  getCurrentBorrows: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const offset = (page - 1) * limit;
      
      const searchPattern = `%${search}%`;
      
      const [borrows] = await pool.query(`
        SELECT 
            br.borrow_id,
            br.borrow_date,
            br.due_date,
            DATEDIFF(br.due_date, CURDATE()) AS days_remaining,
            CASE 
                WHEN br.due_date < CURDATE() THEN DATEDIFF(CURDATE(), br.due_date)
                ELSE 0
            END AS days_overdue,
            br.status,
            r.reader_id,
            r.full_name AS reader_name,
            r.email AS reader_email,
            r.phone AS reader_phone,
            r.address AS reader_address,
            b.book_id,
            b.title AS book_title,
            b.author AS book_author,
            c.name AS category_name,
            b.image_url AS book_image
        FROM BorrowRecords br
        INNER JOIN Readers r ON br.reader_id = r.reader_id
        INNER JOIN Books b ON br.book_id = b.book_id
        LEFT JOIN Categories c ON b.category_id = c.category_id
        WHERE br.status = 'BORROWING'
          AND br.return_date IS NULL
          AND (
            r.full_name LIKE ?
            OR b.title LIKE ?
            OR b.author LIKE ?
          )
        ORDER BY br.borrow_date DESC
        LIMIT ? OFFSET ?
      `, [searchPattern, searchPattern, searchPattern, limit, offset]);
      
      const [countResult] = await pool.query(`
        SELECT COUNT(*) AS total
        FROM BorrowRecords br
        INNER JOIN Readers r ON br.reader_id = r.reader_id
        INNER JOIN Books b ON br.book_id = b.book_id
        WHERE br.status = 'BORROWING'
          AND br.return_date IS NULL
          AND (
            r.full_name LIKE ?
            OR b.title LIKE ?
            OR b.author LIKE ?
          )
      `, [searchPattern, searchPattern, searchPattern]);
      
      res.json({
        borrows: borrows,
        pagination: {
          page: page,
          limit: limit,
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      });
    } catch (err) {
      console.error('Lỗi khi lấy danh sách sách đang mượn:', err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  getOverdueBorrows: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const offset = (page - 1) * limit;
      
      const searchPattern = `%${search}%`;
      
      const [overdue] = await pool.query(`
        SELECT 
            br.borrow_id,
            br.borrow_date,
            br.due_date,
            DATEDIFF(CURDATE(), br.due_date) AS days_overdue,
            br.status,
            r.reader_id,
            r.full_name AS reader_name,
            r.email AS reader_email,
            r.phone AS reader_phone,
            r.address AS reader_address,
            b.book_id,
            b.title AS book_title,
            b.author AS book_author,
            c.name AS category_name,
            b.image_url AS book_image
        FROM BorrowRecords br
        INNER JOIN Readers r ON br.reader_id = r.reader_id
        INNER JOIN Books b ON br.book_id = b.book_id
        LEFT JOIN Categories c ON b.category_id = c.category_id
        WHERE (br.status = 'OVERDUE' 
           OR (br.status = 'BORROWING' AND br.due_date < CURDATE() AND br.return_date IS NULL))
          AND (
            r.full_name LIKE ?
            OR b.title LIKE ?
            OR b.author LIKE ?
          )
        ORDER BY days_overdue DESC, br.due_date ASC
        LIMIT ? OFFSET ?
      `, [searchPattern, searchPattern, searchPattern, limit, offset]);
      
      const [countResult] = await pool.query(`
        SELECT COUNT(*) AS total
        FROM BorrowRecords br
        INNER JOIN Readers r ON br.reader_id = r.reader_id
        INNER JOIN Books b ON br.book_id = b.book_id
        WHERE (br.status = 'OVERDUE' 
           OR (br.status = 'BORROWING' AND br.due_date < CURDATE() AND br.return_date IS NULL))
          AND (
            r.full_name LIKE ?
            OR b.title LIKE ?
            OR b.author LIKE ?
          )
      `, [searchPattern, searchPattern, searchPattern]);
      
      res.json({
        overdue: overdue,
        pagination: {
          page: page,
          limit: limit,
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      });
    } catch (err) {
      console.error('Lỗi khi lấy danh sách sách quá hạn:', err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  }
};

module.exports = StatisticsController;

