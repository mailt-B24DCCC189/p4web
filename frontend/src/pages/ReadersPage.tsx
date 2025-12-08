import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Users, Mail, Phone, MapPin, Calendar, Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { apiThuVien } from '@/api/apiThuVien';
import ReaderModal from '@/components/readers/ReaderModal';
import './ReadersPage.css';

const ReadersPage: React.FC = () => {
  const navigate = useNavigate();
  const [readers, setReaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReader, setEditingReader] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadReaders();
  }, [page, searchTerm]);

  const loadReaders = async () => {
    try {
      setLoading(true);
      const data = await apiThuVien.getAllReaders(page, 12, searchTerm);
      setReaders(data.readers || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Lỗi khi tải danh sách thành viên:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadReaders();
  };

  const handleAdd = () => {
    setEditingReader(null);
    setModalOpen(true);
  };

  const handleEdit = (reader: any) => {
    setEditingReader(reader);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thành viên này?')) {
      return;
    }

    try {
      setDeletingId(id);
      await apiThuVien.deleteReader(id);
      loadReaders();
      alert('Xóa thành viên thành công!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa thành viên');
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalSuccess = () => {
    loadReaders();
  };

  return (
    <div className="readers-page">
      <div className="readers-header">
        <button 
          className="back-button" 
          onClick={() => navigate('/dashboard')}
          title="Quay lại Dashboard"
        >
          <ArrowLeft size={20} /> Quay lại
        </button>
        <h1>
          <Users size={32} /> Quản Lý Thành Viên
        </h1>
        <button className="add-button" onClick={handleAdd}>
          <Plus size={20} /> Thêm thành viên
        </button>
      </div>

      {}
      <form onSubmit={handleSearch} className="search-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit">Tìm kiếm</button>
        </div>
      </form>

      {}
      <div className="readers-content">
        {loading ? (
          <div className="loading">Đang tải dữ liệu...</div>
        ) : readers.length === 0 ? (
          <div className="empty-state">
            <Users size={64} />
            <p>Chưa có thành viên nào</p>
            <button className="add-button-empty" onClick={handleAdd}>
              <Plus size={20} /> Thêm thành viên đầu tiên
            </button>
          </div>
        ) : (
          <>
            <div className="readers-grid">
              {readers.map((reader) => (
                <div key={reader.reader_id} className="reader-card">
                  <div className="reader-card-header">
                    <div className="reader-avatar">
                      {reader.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="reader-info-main">
                      <h3>{reader.full_name}</h3>
                      <p className="reader-id">ID: {reader.reader_id}</p>
                    </div>
                    <div className="reader-actions">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleEdit(reader)}
                        title="Sửa"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(reader.reader_id)}
                        disabled={deletingId === reader.reader_id}
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="reader-details">
                    {reader.email && (
                      <div className="detail-item">
                        <Mail size={16} />
                        <span>{reader.email}</span>
                      </div>
                    )}
                    {reader.phone && (
                      <div className="detail-item">
                        <Phone size={16} />
                        <span>{reader.phone}</span>
                      </div>
                    )}
                    {reader.address && (
                      <div className="detail-item">
                        <MapPin size={16} />
                        <span>{reader.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="reader-stats">
                    <div className="stat-item">
                      <BookOpen size={18} />
                      <div>
                        <div className="stat-value">{reader.current_borrows || 0}</div>
                        <div className="stat-label">Đang mượn</div>
                      </div>
                    </div>
                    <div className="stat-item">
                      <div>
                        <div className="stat-value">{reader.max_quota || 5}</div>
                        <div className="stat-label">Hạn mức</div>
                      </div>
                    </div>
                    {reader.created_at && (
                      <div className="stat-item">
                        <Calendar size={16} />
                        <div className="stat-label-small">
                          {new Date(reader.created_at).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
      <ReaderModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingReader(null);
        }}
        onSuccess={handleModalSuccess}
        reader={editingReader}
      />
    </div>
  );
};

export default ReadersPage;
