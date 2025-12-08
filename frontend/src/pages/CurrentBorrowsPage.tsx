import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, BookOpen, User, Calendar, Clock, RotateCcw } from 'lucide-react';
import { apiThuVien } from '@/api/apiThuVien';
import './CurrentBorrowsPage.css';

const CurrentBorrowsPage: React.FC = () => {
  const navigate = useNavigate();
  const [borrows, setBorrows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    loadBorrows();
  }, [page, searchTerm]);

  const loadBorrows = async () => {
    try {
      setLoading(true);
      const data = await apiThuVien.getCurrentBorrows(page, 10, searchTerm);
      setBorrows(data.borrows || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Lỗi khi tải danh sách sách đang mượn:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadBorrows();
  };

  const handleReturn = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn trả sách này?')) return;
    try {
      setLoading(true);
      await apiThuVien.returnBook(id);
      alert('Trả sách thành công!');
      loadBorrows();
      window.dispatchEvent(new CustomEvent('borrow:changed'));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi trả sách');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="current-borrows-page">
      <div className="page-header">
        <button 
          className="back-button" 
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={20} /> Quay lại
        </button>
        <h1>
          <BookOpen size={32} /> Sách Đang Mượn
        </h1>
      </div>

      <form onSubmit={handleSearch} className="search-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên bạn đọc, tên sách, tác giả..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit">Tìm kiếm</button>
        </div>
      </form>

      <div className="borrows-content">
        {loading ? (
          <div className="loading">Đang tải dữ liệu...</div>
        ) : borrows.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={64} />
            <p>Không có sách nào đang được mượn</p>
          </div>
        ) : (
          <>
            <div className="borrows-table">
              <table>
                <thead>
                  <tr>
                    <th>Bạn đọc</th>
                    <th>Sách</th>
                    <th>Tác giả</th>
                    <th>Ngày mượn</th>
                    <th>Hạn trả</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {borrows.map((borrow) => (
                    <tr key={borrow.borrow_id}>
                      <td>
                        <div className="reader-cell">
                          <User size={16} />
                          <div>
                            <strong>{borrow.reader_name}</strong>
                            <span className="reader-contact">{borrow.reader_email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{borrow.book_title}</strong>
                        {borrow.category_name && (
                          <span className="category-tag">{borrow.category_name}</span>
                        )}
                      </td>
                      <td>{borrow.book_author}</td>
                      <td>
                        <div className="date-cell">
                          <Calendar size={14} />
                          {formatDate(borrow.borrow_date)}
                        </div>
                      </td>
                      <td>
                        <div className={`date-cell ${borrow.days_overdue > 0 ? 'overdue' : ''}`}>
                          <Clock size={14} />
                          {formatDate(borrow.due_date)}
                          {borrow.days_remaining > 0 && (
                            <span className="days-remaining">({borrow.days_remaining} ngày)</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn return-btn"
                            onClick={() => handleReturn(borrow.borrow_id)}
                            title="Đã trả sách"
                          >
                            <RotateCcw size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Trước
                </button>
                <span>
                  Trang {pagination.page} / {pagination.totalPages}
                </span>
                <button 
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CurrentBorrowsPage;
