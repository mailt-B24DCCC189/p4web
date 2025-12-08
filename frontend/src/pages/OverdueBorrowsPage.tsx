import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, AlertTriangle, User, BookOpen, Calendar, RotateCcw, Clock, Edit } from 'lucide-react';
import { apiThuVien } from '@/api/apiThuVien';
import './OverdueBorrowsPage.css';

const OverdueBorrowsPage: React.FC = () => {
  const navigate = useNavigate();
  const [overdue, setOverdue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    loadOverdue();
  }, [page, searchTerm]);

  const loadOverdue = async () => {
    try {
      setLoading(true);
      const data = await apiThuVien.getOverdueBorrows(page, 10, searchTerm);
      setOverdue(data.overdue || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Lỗi khi tải danh sách sách quá hạn:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadOverdue();
  };

  const handleReturn = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn trả sách này?')) {
      return;
    }

    try {
      setProcessingId(id);
      await apiThuVien.returnBook(id);
      alert('Trả sách thành công!');
      loadOverdue();
      window.dispatchEvent(new CustomEvent('borrow:changed'));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi trả sách');
    } finally {
      setProcessingId(null);
    }
  };

  const handleExtend = async (id: number) => {
    if (!window.confirm('Bạn có muốn gia hạn thêm 7 ngày?')) {
      return;
    }

    try {
      setProcessingId(id);
      await apiThuVien.extendBorrow(id, 7);
      alert('Gia hạn thành công!');
      loadOverdue();
      window.dispatchEvent(new CustomEvent('borrow:changed'));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi gia hạn');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="overdue-borrows-page">
      <div className="page-header">
        <button 
          className="back-button" 
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={20} /> Quay lại
        </button>
        <h1>
          <AlertTriangle size={32} /> Sách Quá Hạn
        </h1>
        <div className="overdue-badge-header">
          <AlertTriangle size={20} />
          <span>{pagination?.total || 0} sách quá hạn</span>
        </div>
      </div>

      <form onSubmit={handleSearch} className="search-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên bạn đọc, tên sách..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit">Tìm kiếm</button>
        </div>
      </form>

      <div className="content-area">
        {loading ? (
          <div className="loading">Đang tải dữ liệu...</div>
        ) : overdue.length === 0 ? (
          <div className="empty-state">
            <AlertTriangle size={64} />
            <p>Không có sách nào quá hạn</p>
          </div>
        ) : (
          <>
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Bạn đọc</th>
                    <th>Sách</th>
                    <th>Tác giả</th>
                    <th>Ngày mượn</th>
                    <th>Hạn trả</th>
                    <th>Quá hạn</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {overdue.map((item) => (
                    <tr key={item.borrow_id} className="overdue-row">
                      <td>
                        <div className="reader-info">
                          <User size={16} />
                          <div>
                            <strong>{item.reader_name}</strong>
                            <span>{item.reader_phone || item.reader_email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{item.book_title}</strong>
                        {item.category_name && (
                          <span className="category-tag">{item.category_name}</span>
                        )}
                      </td>
                      <td>{item.book_author}</td>
                      <td>
                        <div className="date-info">
                          <Calendar size={14} />
                          {formatDate(item.borrow_date)}
                        </div>
                      </td>
                      <td>
                        <div className="date-info overdue">
                          {formatDate(item.due_date)}
                        </div>
                      </td>
                      <td>
                        <span className="overdue-days">
                          {item.days_overdue || item.days_overdue_calc || 0} ngày
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn extend-btn"
                            onClick={() => handleExtend(item.borrow_id)}
                            disabled={processingId === item.borrow_id}
                            title="Gia hạn"
                          >
                            <Clock size={14} />
                          </button>
                          <button
                            className="action-btn return-btn"
                            onClick={() => handleReturn(item.borrow_id)}
                            disabled={processingId === item.borrow_id}
                            title="Trả sách"
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

export default OverdueBorrowsPage;
