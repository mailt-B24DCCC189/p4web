import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, BookOpen, Plus, Edit, Trash2, RotateCcw, Clock } from 'lucide-react';
import { apiThuVien } from '@/api/apiThuVien';
import BorrowModal from '@/components/borrows/BorrowModal';
import './Borrows.css';

const BorrowsPage: React.FC = () => {
  const navigate = useNavigate();
  const [borrows, setBorrows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBorrow, setEditingBorrow] = useState<any>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    loadBorrows();
  }, [page, searchTerm, statusFilter]);

  const loadBorrows = async () => {
    try {
      setLoading(true);
      const data = await apiThuVien.getAllBorrows(page, 10, searchTerm, statusFilter);
      setBorrows(data.borrows || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Lỗi khi tải danh sách phiếu mượn:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadBorrows();
  };

  const handleAdd = () => {
    setEditingBorrow(null);
    setModalOpen(true);
  };

  const handleEdit = (borrow: any) => {
    setEditingBorrow(borrow);
    setModalOpen(true);
  };

  const handleReturn = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn trả sách này?')) {
      return;
    }

    try {
      setProcessingId(id);
      await apiThuVien.returnBook(id);
      alert('Trả sách thành công!');
      loadBorrows();
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
      loadBorrows();
      window.dispatchEvent(new CustomEvent('borrow:changed'));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi gia hạn');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phiếu mượn này?')) {
      return;
    }

    try {
      setProcessingId(id);
      await apiThuVien.deleteBorrow(id);
      alert('Xóa phiếu mượn thành công!');
      loadBorrows();
      window.dispatchEvent(new CustomEvent('borrow:changed'));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa phiếu mượn');
    } finally {
      setProcessingId(null);
    }
  };

  const handleModalSuccess = () => {
    loadBorrows();
    window.dispatchEvent(new CustomEvent('borrow:changed'));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (borrow: any) => {
    if (borrow.return_date) {
      return <span className="status-badge returned">Đã trả</span>;
    }
    if (borrow.days_overdue_calc > 0) {
      return <span className="status-badge overdue">Quá hạn {borrow.days_overdue_calc} ngày</span>;
    }
    if (borrow.days_remaining > 0) {
      return <span className="status-badge active">Còn {borrow.days_remaining} ngày</span>;
    }
    return <span className="status-badge active">Đang mượn</span>;
  };

  return (
    <div className="borrows-page">
      <div className="borrows-header">
        <button 
          className="back-button" 
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={20} /> Quay lại
        </button>
        <h1>
          <BookOpen size={32} /> Quản Lý Mượn Sách
        </h1>
        <button className="add-button" onClick={handleAdd}>
          <Plus size={20} /> Tạo phiếu mới
        </button>
      </div>

      {}
      <form onSubmit={handleSearch} className="search-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên bạn đọc, tên sách, tác giả..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="status-filter"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="BORROWING">Đang mượn</option>
            <option value="RETURNED">Đã trả</option>
            <option value="OVERDUE">Quá hạn</option>
          </select>
          <button type="submit">Tìm kiếm</button>
        </div>
      </form>

      {}
      <div className="borrows-content">
        {loading ? (
          <div className="loading">Đang tải dữ liệu...</div>
        ) : borrows.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={64} />
            <p>Chưa có phiếu mượn nào</p>
            <button className="add-button-empty" onClick={handleAdd}>
              <Plus size={20} /> Tạo phiếu mượn đầu tiên
            </button>
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
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {borrows.map((borrow) => (
                    <tr key={borrow.borrow_id} className={borrow.days_overdue_calc > 0 ? 'overdue-row' : ''}>
                      <td>
                        <div className="reader-cell">
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
                          {formatDate(borrow.borrow_date)}
                        </div>
                      </td>
                      <td>
                        <div className={`date-cell ${borrow.days_overdue_calc > 0 ? 'overdue' : ''}`}>
                          {formatDate(borrow.due_date)}
                        </div>
                      </td>
                      <td>
                        {getStatusBadge(borrow)}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {!borrow.return_date && (
                            <>
                              <button
                                className="action-btn edit-btn"
                                onClick={() => handleEdit(borrow)}
                                title="Sửa"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                className="action-btn extend-btn"
                                onClick={() => handleExtend(borrow.borrow_id)}
                                disabled={processingId === borrow.borrow_id}
                                title="Gia hạn"
                              >
                                <Clock size={14} />
                              </button>
                              <button
                                className="action-btn return-btn"
                                onClick={() => handleReturn(borrow.borrow_id)}
                                disabled={processingId === borrow.borrow_id}
                                title="Trả sách"
                              >
                                <RotateCcw size={14} />
                              </button>
                            </>
                          )}
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDelete(borrow.borrow_id)}
                            disabled={processingId === borrow.borrow_id}
                            title="Xóa"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {}
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

      {}
      <BorrowModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingBorrow(null);
        }}
        onSuccess={handleModalSuccess}
        borrow={editingBorrow}
      />
    </div>
  );
};

export default BorrowsPage;
