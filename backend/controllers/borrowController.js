const pool = require('../db');

const BorrowController = {
  getAllBorrows: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const status = req.query.status || ''; // BORROWING, RETURNED, OVERDUE
      const offset = (page - 1) * limit;
      
      const searchPattern = `%${search}%`;
      
      let whereClause = '1=1';
      const params = [];
      
      if (search) {
        whereClause += ' AND (r.full_name LIKE ? OR b.title LIKE ? OR b.author LIKE ?)';
        params.push(searchPattern, searchPattern, searchPattern);
      }
      
      if (status) {
        whereClause += ' AND br.status = ?';
        params.push(status);
      }
      
      const [borrows] = await pool.query(`
        SELECT 
            br.borrow_id,
            br.borrow_date,
            br.due_date,
            br.return_date,
            br.status,
            DATEDIFF(CURDATE(), br.due_date) AS days_overdue,
            CASE 
                WHEN br.due_date < CURDATE() AND br.return_date IS NULL THEN DATEDIFF(CURDATE(), br.due_date)
                ELSE 0
            END AS days_overdue_calc,
            DATEDIFF(br.due_date, CURDATE()) AS days_remaining,
            r.reader_id,
            r.full_name AS reader_name,
            r.email AS reader_email,
            r.phone AS reader_phone,
            b.book_id,
            b.title AS book_title,
            b.author AS book_author,
            c.name AS category_name,
            b.image_url AS book_image
        FROM BorrowRecords br
        INNER JOIN Readers r ON br.reader_id = r.reader_id
        INNER JOIN Books b ON br.book_id = b.book_id
        LEFT JOIN Categories c ON b.category_id = c.category_id
        WHERE ${whereClause}
        ORDER BY br.borrow_date DESC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);
      
      const [countResult] = await pool.query(`
        SELECT COUNT(*) AS total
        FROM BorrowRecords br
        INNER JOIN Readers r ON br.reader_id = r.reader_id
        INNER JOIN Books b ON br.book_id = b.book_id
        WHERE ${whereClause}
      `, params);
      
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
      console.error('Lỗi khi lấy danh sách phiếu mượn:', err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  getBorrowById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const [borrows] = await pool.query(`
        SELECT 
            br.borrow_id,
            br.borrow_date,
            br.due_date,
            br.return_date,
            br.status,
            DATEDIFF(CURDATE(), br.due_date) AS days_overdue,
            DATEDIFF(br.due_date, CURDATE()) AS days_remaining,
            r.reader_id,
            r.full_name AS reader_name,
            r.email AS reader_email,
            r.phone AS reader_phone,
            r.address AS reader_address,
            r.max_quota,
            b.book_id,
            b.title AS book_title,
            b.author AS book_author,
            c.name AS category_name,
            b.image_url AS book_image,
            b.available_quantity
        FROM BorrowRecords br
        INNER JOIN Readers r ON br.reader_id = r.reader_id
        INNER JOIN Books b ON br.book_id = b.book_id
        LEFT JOIN Categories c ON b.category_id = c.category_id
        WHERE br.borrow_id = ?
      `, [id]);
      
      if (borrows.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy phiếu mượn' });
      }
      
      res.json(borrows[0]);
    } catch (err) {
      console.error('Lỗi khi lấy thông tin phiếu mượn:', err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  createBorrow: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const { reader_id, book_id, borrow_date, due_date } = req.body;
      
      if (!reader_id || !book_id) {
        await connection.rollback();
        return res.status(400).json({ message: 'Thiếu thông tin bạn đọc hoặc sách' });
      }
      
      const [readers] = await connection.query(
        'SELECT * FROM Readers WHERE reader_id = ?',
        [reader_id]
      );
      
      if (readers.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Không tìm thấy bạn đọc' });
      }
      
      const reader = readers[0];
      
      const [currentBorrows] = await connection.query(
        `SELECT COUNT(*) AS count 
         FROM BorrowRecords 
         WHERE reader_id = ? AND status = 'BORROWING' AND return_date IS NULL`,
        [reader_id]
      );
      
      if (currentBorrows[0].count >= reader.max_quota) {
        await connection.rollback();
        return res.status(400).json({ 
          message: `Bạn đọc đã mượn quá số lượng cho phép (${reader.max_quota} cuốn)` 
        });
      }
      
      const [books] = await connection.query(
        'SELECT * FROM Books WHERE book_id = ? AND is_hidden = 0 FOR UPDATE',
        [book_id]
      );
      
      if (books.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Không tìm thấy sách' });
      }
      
      const book = books[0];
      
      if (book.available_quantity <= 0) {
        await connection.rollback();
        return res.status(400).json({ message: 'Sách đã hết, không thể mượn' });
      }
      
      const borrowDate = borrow_date ? new Date(borrow_date) : new Date();
      let dueDate;
      
      if (due_date) {
        dueDate = new Date(due_date);
      } else {
        dueDate = new Date(borrowDate);
        dueDate.setDate(dueDate.getDate() + 14); // Mặc định 14 ngày
      }
      
      const [result] = await connection.query(`
        INSERT INTO BorrowRecords (reader_id, book_id, borrow_date, due_date, status)
        VALUES (?, ?, ?, ?, 'BORROWING')
      `, [reader_id, book_id, borrowDate, dueDate]);
      
      await connection.query(
        'UPDATE Books SET available_quantity = available_quantity - 1 WHERE book_id = ?',
        [book_id]
      );
      
      await connection.commit();
      
      res.status(201).json({
        message: 'Tạo phiếu mượn thành công',
        borrow_id: result.insertId
      });
    } catch (err) {
      await connection.rollback();
      console.error('Lỗi khi tạo phiếu mượn:', err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    } finally {
      connection.release();
    }
  },

  updateBorrow: async (req, res) => {
    try {
      const { id } = req.params;
      const { due_date, borrow_date } = req.body;
      
      const [borrows] = await pool.query(
        'SELECT * FROM BorrowRecords WHERE borrow_id = ?',
        [id]
      );
      
      if (borrows.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy phiếu mượn' });
      }
      
      const borrow = borrows[0];
      
      if (borrow.return_date) {
        return res.status(400).json({ message: 'Không thể sửa phiếu mượn đã trả' });
      }
      
      const updateFields = [];
      const updateValues = [];
      
      if (due_date) {
        updateFields.push('due_date = ?');
        updateValues.push(new Date(due_date));
      }
      
      if (borrow_date) {
        updateFields.push('borrow_date = ?');
        updateValues.push(new Date(borrow_date));
      }
      
      if (due_date) {
        const newDueDate = new Date(due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        newDueDate.setHours(0, 0, 0, 0);
        
        if (newDueDate < today) {
          updateFields.push("status = 'OVERDUE'");
        } else {
          updateFields.push("status = 'BORROWING'");
        }
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({ message: 'Không có thông tin nào để cập nhật' });
      }
      
      updateValues.push(id);
      
      await pool.query(`
        UPDATE BorrowRecords 
        SET ${updateFields.join(', ')}
        WHERE borrow_id = ?
      `, updateValues);
      
      res.json({ message: 'Cập nhật phiếu mượn thành công' });
    } catch (err) {
      console.error('Lỗi khi cập nhật phiếu mượn:', err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  returnBook: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const { id } = req.params;
      
      const [borrows] = await connection.query(
        'SELECT * FROM BorrowRecords WHERE borrow_id = ? AND return_date IS NULL',
        [id]
      );
      
      if (borrows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Không tìm thấy phiếu mượn hoặc đã trả' });
      }
      
      const borrow = borrows[0];  
      
      await connection.query(`
        UPDATE BorrowRecords 
        SET return_date = NOW(), status = 'RETURNED'
        WHERE borrow_id = ?
      `, [id]);
      
      await connection.query(
        'UPDATE Books SET available_quantity = available_quantity + 1 WHERE book_id = ?',
        [borrow.book_id]
      );
      
      await connection.commit();
      
      res.json({ message: 'Trả sách thành công' });
    } catch (err) {
      await connection.rollback();
      console.error('Lỗi khi trả sách:', err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    } finally {
      connection.release();
    }
  },

  extendBorrow: async (req, res) => {
    try {
      const { id } = req.params;
      const { days = 7 } = req.body; // Mặc định gia hạn 7 ngày
      
      if (!days || days <= 0 || !Number.isInteger(Number(days))) {
        return res.status(400).json({ message: 'Số ngày gia hạn không hợp lệ' });
      }
      
      const [borrows] = await pool.query(
        'SELECT borrow_id, due_date, status FROM BorrowRecords WHERE borrow_id = ? AND return_date IS NULL',
        [id]
      );
      
      if (borrows.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy phiếu mượn hoặc đã trả' });
      }
      
      const borrow = borrows[0];
      const oldDueDate = borrow.due_date;
      
      console.log(`[Extend Borrow] ID: ${id}`);
      console.log(`[Extend Borrow] Old due_date: ${oldDueDate}`);
      console.log(`[Extend Borrow] Days to add: ${days}`);
      
      await pool.query(`
        UPDATE BorrowRecords 
        SET 
          due_date = DATE_ADD(due_date, INTERVAL ? DAY),
          status = CASE 
            WHEN DATE(DATE_ADD(due_date, INTERVAL ? DAY)) < CURDATE() THEN 'OVERDUE'
            ELSE 'BORROWING'
          END
        WHERE borrow_id = ?
      `, [days, days, id]);
      
      const [updatedBorrows] = await pool.query(
        'SELECT due_date, status FROM BorrowRecords WHERE borrow_id = ?',
        [id]
      );
      
      const updatedBorrow = updatedBorrows[0];
      const newDueDate = updatedBorrow.due_date;
      const newStatus = updatedBorrow.status;
      
      console.log(`[Extend Borrow] New due_date: ${newDueDate}`);
      console.log(`[Extend Borrow] New status: ${newStatus}`);
      
      const [diffResult] = await pool.query(`
        SELECT DATEDIFF(?, ?) AS days_added
      `, [newDueDate, oldDueDate]);
      
      const daysAdded = diffResult[0].days_added;
      console.log(`[Extend Borrow] Actual days added: ${daysAdded}`);
      
      if (daysAdded !== days) {
        console.warn(`[Extend Borrow] WARNING: Expected ${days} days but got ${daysAdded} days`);
      }
      
      res.json({ 
        message: `Gia hạn thành công thêm ${days} ngày`,
        old_due_date: oldDueDate,
        new_due_date: newDueDate,
        days_added: daysAdded,
        status: newStatus
      });
    } catch (err) {
      console.error('[Extend Borrow] Lỗi khi gia hạn:', err);
      console.error('[Extend Borrow] Stack:', err.stack);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  deleteBorrow: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const { id } = req.params;
      
      const [borrows] = await connection.query(
        'SELECT * FROM BorrowRecords WHERE borrow_id = ?',
        [id]
      );
      
      if (borrows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Không tìm thấy phiếu mượn' });
      }
      
      const borrow = borrows[0];
      
      if (!borrow.return_date) {
        await connection.query(
          'UPDATE Books SET available_quantity = available_quantity + 1 WHERE book_id = ?',
          [borrow.book_id]
        );
      }
      
      await connection.query('DELETE FROM BorrowRecords WHERE borrow_id = ?', [id]);
      
      await connection.commit();
      
      res.json({ message: 'Xóa phiếu mượn thành công' });
    } catch (err) {
      await connection.rollback();
      console.error('Lỗi khi xóa phiếu mượn:', err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    } finally {
      connection.release();
    }
  }
};

module.exports = BorrowController;
