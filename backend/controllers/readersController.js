const pool = require('../db');

const ReadersController = {
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

  getReaderById: async (req, res) => {
    try {
      const { id } = req.params;
      
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
        WHERE r.reader_id = ?
        GROUP BY r.reader_id, r.full_name, r.email, r.phone, r.address, r.max_quota, r.created_at
      `, [id]);
      
      if (readers.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy thành viên' });
      }
      
      res.json(readers[0]);
    } catch (err) {
      console.error('Lỗi khi lấy thông tin thành viên:', err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  createReader: async (req, res) => {
    try {
      const { full_name, email, phone, address, max_quota } = req.body;
      
      if (!full_name || full_name.trim() === '') {
        return res.status(400).json({ message: 'Họ tên không được để trống' });
      }
      
      if (email) {
        const [existing] = await pool.query(
          'SELECT * FROM Readers WHERE email = ?',
          [email]
        );
        if (existing.length > 0) {
          return res.status(400).json({ message: 'Email đã tồn tại' });
        }
      }
      
      if (phone) {
        const [existing] = await pool.query(
          'SELECT * FROM Readers WHERE phone = ?',
          [phone]
        );
        if (existing.length > 0) {
          return res.status(400).json({ message: 'Số điện thoại đã tồn tại' });
        }
      }
      
      const [result] = await pool.query(`
        INSERT INTO Readers (full_name, email, phone, address, max_quota)
        VALUES (?, ?, ?, ?, ?)
      `, [full_name.trim(), email || null, phone || null, address || null, max_quota || 5]);
      
      res.status(201).json({
        message: 'Tạo thành viên thành công',
        reader_id: result.insertId
      });
    } catch (err) {
      console.error('Lỗi khi tạo thành viên:', err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  updateReader: async (req, res) => {
    try {
      const { id } = req.params;
      const { full_name, email, phone, address, max_quota } = req.body;
      
      const [existing] = await pool.query(
        'SELECT * FROM Readers WHERE reader_id = ?',
        [id]
      );
      
      if (existing.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy thành viên' });
      }
      
      if (!full_name || full_name.trim() === '') {
        return res.status(400).json({ message: 'Họ tên không được để trống' });
      }
      
      if (email && email !== existing[0].email) {
        const [emailCheck] = await pool.query(
          'SELECT * FROM Readers WHERE email = ? AND reader_id != ?',
          [email, id]
        );
        if (emailCheck.length > 0) {
          return res.status(400).json({ message: 'Email đã tồn tại' });
        }
      }
      
      if (phone && phone !== existing[0].phone) {
        const [phoneCheck] = await pool.query(
          'SELECT * FROM Readers WHERE phone = ? AND reader_id != ?',
          [phone, id]
        );
        if (phoneCheck.length > 0) {
          return res.status(400).json({ message: 'Số điện thoại đã tồn tại' });
        }
      }
      
      await pool.query(`
        UPDATE Readers 
        SET full_name = ?, email = ?, phone = ?, address = ?, max_quota = ?
        WHERE reader_id = ?
      `, [full_name.trim(), email || null, phone || null, address || null, max_quota || 5, id]);
      
      res.json({ message: 'Cập nhật thành viên thành công' });
    } catch (err) {
      console.error('Lỗi khi cập nhật thành viên:', err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  deleteReader: async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`[DELETE Reader] Bắt đầu xóa thành viên ID: ${id}`);
      
      const [existing] = await pool.query(
        'SELECT * FROM Readers WHERE reader_id = ?',
        [id]
      );
      
      if (existing.length === 0) {
        console.log(`[DELETE Reader] Không tìm thấy thành viên ID: ${id}`);
        return res.status(404).json({ message: 'Không tìm thấy thành viên' });
      }
      
      const [borrows] = await pool.query(`
        SELECT COUNT(*) AS count 
        FROM BorrowRecords 
        WHERE reader_id = ? AND return_date IS NULL
      `, [id]);
      
      const borrowCount = borrows[0].count;
      console.log(`[DELETE Reader] Số sách đang mượn: ${borrowCount}`);
      
      if (borrowCount > 0) {
        return res.status(400).json({ 
          message: 'Không thể xóa thành viên đang có sách mượn chưa trả' 
        });
      }
      
      await pool.query('DELETE FROM BorrowRecords WHERE reader_id = ?', [id]);
      console.log(`[DELETE Reader] Đã xóa các bản ghi mượn sách của thành viên ID: ${id}`);
      
      await pool.query('DELETE FROM Readers WHERE reader_id = ?', [id]);
      console.log(`[DELETE Reader] Đã xóa thành viên ID: ${id} thành công`);
      
      res.json({ message: 'Xóa thành viên thành công' });
    } catch (err) {
      console.error('[DELETE Reader] Lỗi khi xóa thành viên:', err);
      console.error('[DELETE Reader] Stack trace:', err.stack);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  }
};

module.exports = ReadersController;
