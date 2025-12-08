const pool = require('./db');

const QuanLySachController = {
  
  layDanhSachSach: async (req, res) => {
    try {
      const { search: tuKhoa, category_id: maTheLoai, page: trang = 1, limit: gioiHan = 10 } = req.query;
      const viTriBatDau = (Number(trang) - 1) * Number(gioiHan);

      let cauLenhSql = `
        SELECT b.book_id as id, b.title, b.author, b.category_id, b.total_quantity, b.available_quantity, b.published_year,
               b.image_url, 
               c.name as ten_the_loai 
        FROM Books b 
        LEFT JOIN Categories c ON b.category_id = c.category_id 
        WHERE b.is_hidden = 0
      `;
      const thamSo = [];

      if (tuKhoa) {
        cauLenhSql += ` AND (b.title LIKE ? OR b.author LIKE ?)`;
        thamSo.push(`%${tuKhoa}%`, `%${tuKhoa}%`);
      }
      if (maTheLoai) {
        cauLenhSql += ` AND b.category_id = ?`;
        thamSo.push(maTheLoai);
      }

      cauLenhSql += ` ORDER BY b.book_id DESC LIMIT ? OFFSET ?`;
      thamSo.push(Number(gioiHan), viTriBatDau);

      const [danhSachSach] = await pool.query(cauLenhSql, thamSo);

      let cauLenhDem = `SELECT COUNT(*) as total FROM Books b WHERE b.is_hidden = 0`;
      const thamSoDem = [];
      if (tuKhoa) {
        cauLenhDem += ` AND (b.title LIKE ? OR b.author LIKE ?)`;
        thamSoDem.push(`%${tuKhoa}%`, `%${tuKhoa}%`);
      }
      if (maTheLoai) {
        cauLenhDem += ` AND b.category_id = ?`;
        thamSoDem.push(maTheLoai);
      }
      const [ketQuaDem] = await pool.query(cauLenhDem, thamSoDem);

      res.json({
        duLieu: danhSachSach,
        phanTrang: {
          tongSoBanGhi: ketQuaDem[0].total,
          trangHienTai: Number(trang),
          tongSoTrang: Math.ceil(ketQuaDem[0].total / Number(gioiHan))
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  layDanhSachTheLoai: async (req, res) => {
    try {
      const [categories] = await pool.query('SELECT category_id, name FROM Categories');
      res.json(categories);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  themSachMoi: async (req, res) => {
    try {
      const { title, author, category_id, total_quantity, available_quantity, published_year, image_url } = req.body;
      
      const finalImage = image_url || 'https://placehold.co/300x400?text=No+Image';
      
      const finalAvailable = available_quantity !== undefined ? available_quantity : total_quantity;

      if (Number(finalAvailable) > Number(total_quantity)) {
        return res.status(400).json({ message: 'Số lượng có sẵn không thể lớn hơn Tổng số lượng!' });
      }

      const [result] = await pool.query(
        `INSERT INTO Books (title, author, category_id, total_quantity, available_quantity, published_year, image_url, is_hidden)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [title, author, category_id, total_quantity, finalAvailable, published_year, finalImage]
      );

      res.status(201).json({ message: 'Thêm sách thành công', bookId: result.insertId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  capNhatSach: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, author, category_id, total_quantity, available_quantity, published_year, image_url } = req.body;

      if (Number(available_quantity) > Number(total_quantity)) {
        return res.status(400).json({ message: 'Số lượng có sẵn không thể lớn hơn Tổng số lượng!' });
      }

      await pool.query(
        `UPDATE Books SET title = ?, author = ?, category_id = ?, total_quantity = ?, available_quantity = ?, published_year = ?, image_url = ?
         WHERE book_id = ?`,
        [title, author, category_id, total_quantity, available_quantity, published_year, image_url, id]
      );

      res.json({ message: 'Cập nhật sách thành công' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  xoaSach: async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query('UPDATE Books SET is_hidden = 1 WHERE book_id = ?', [id]);
      res.json({ message: 'Đã xóa sách thành công (Ẩn khỏi hệ thống)' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  }
};

module.exports = QuanLySachController;