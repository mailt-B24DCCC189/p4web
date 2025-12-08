
import React, { useEffect, useState } from 'react';
import { apiThuVien } from '../api/apiThuVien';
import { Edit, Trash2, Plus, Search, BookOpen, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './QuanLySach.css';

interface Sach {
  id: number;
  title: string;
  author: string;
  category_id: number;
  ten_the_loai?: string;
  total_quantity: number;
  available_quantity: number;
  published_year: number;
  image_url?: string;
}

interface TheLoai {
  category_id: number;
  name: string;
}

const QuanLySach: React.FC = () => {
  const navigate = useNavigate();

  const [danhSachSach, setDanhSachSach] = useState<Sach[]>([]);
  const [danhSachTheLoai, setDanhSachTheLoai] = useState<TheLoai[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [tuKhoa, setTuKhoa] = useState<string>('');
  const [trangHienTai, setTrangHienTai] = useState(1);
  const [tongSoTrang, setTongSoTrang] = useState(1);

  const [hienModal, setHienModal] = useState(false);
  const [dangSuaSach, setDangSuaSach] = useState<Sach | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category_id: 0,
    published_year: undefined as number | undefined,
    total_quantity: 0,
    available_quantity: 0,
    image_url: ''
  });

  useEffect(() => {
    const fetchTheLoai = async () => {
      try {
        const data = await apiThuVien.layDanhSachTheLoai();
        setDanhSachTheLoai(data);
      } catch (error) { console.error("Lỗi tải thể loại:", error); }
    };
    fetchTheLoai();
  }, []);

  useEffect(() => {
    taiDanhSachSach();
  }, [trangHienTai, tuKhoa]);

  const taiDanhSachSach = async () => {
    setIsLoading(true);
    try {
      const data = await apiThuVien.layDanhSachSach(trangHienTai, tuKhoa);
      if (data) {
        setDanhSachSach(data.duLieu || []);
        if (data.phanTrang) setTongSoTrang(data.phanTrang.tongSoTrang);
      }
    } catch (error) { console.error("Lỗi tải sách:", error); } 
    finally { setIsLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (Number(formData.available_quantity) > Number(formData.total_quantity)) {
        alert("Lỗi: Số lượng có sẵn không được lớn hơn Tổng số lượng!");
        return;
      }

      const dataToSend = {
        title: formData.title,
        author: formData.author,
        category_id: formData.category_id > 0 ? formData.category_id : null,
        published_year: formData.published_year || null,
        total_quantity: formData.total_quantity,
        available_quantity: formData.available_quantity,
        image_url: formData.image_url || 'https://placehold.co/300x400?text=No+Image'
      };

      if (dangSuaSach) {
        await apiThuVien.capNhatSach(dangSuaSach.id, dataToSend);
        alert('Cập nhật sách thành công!');
      } else {
        await apiThuVien.themSachMoi(dataToSend);
        alert('Thêm sách mới thành công!');
      }
      setHienModal(false);
      taiDanhSachSach();
    } catch (error: any) { 
      console.error('Lỗi khi thêm/sửa sách:', error);
      let errorMessage = 'Có lỗi xảy ra, vui lòng kiểm tra lại!';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!';
        } else if (error.response.status === 403) {
          errorMessage = 'Bạn không có quyền thực hiện thao tác này!';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  const handleXoa = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sách này không?')) {
      try {
        await apiThuVien.xoaSach(id);
        taiDanhSachSach();
      } catch (error) { alert('Lỗi khi xóa sách'); }
    }
  };

  const openAddModal = () => {
    setDangSuaSach(null);
    setFormData({
      title: '', 
      author: '',
      category_id: 0,
      published_year: undefined,
      total_quantity: 0,
      available_quantity: 0,
      image_url: ''
    });
    setHienModal(true);
  };

  const openEditModal = (sach: Sach) => {
    setDangSuaSach(sach);
    setFormData({
      title: sach.title || '', 
      author: sach.author || '',
      category_id: sach.category_id || 0,
      published_year: sach.published_year || undefined,
      total_quantity: sach.total_quantity || 0,
      available_quantity: sach.available_quantity || 0,
      image_url: sach.image_url || ''
    });
    setHienModal(true);
  };

  return (
    <div className="quan-ly-sach-container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => navigate('/dashboard')} className="btn-back"><ArrowLeft size={20} /></button>
          <h2><BookOpen className="icon" /> Thư Viện Sách</h2>
        </div>
        <button className="btn-primary" onClick={openAddModal}><Plus size={18} /> Thêm sách mới</button>
      </div>

      {}
      <div className="search-bar">
        {}
        <Search className="search-icon" size={20} />
        <input 
          type="text" 
          placeholder="Tìm kiếm sách, tác giả..." 
          value={tuKhoa} 
          onChange={(e) => { setTuKhoa(e.target.value); setTrangHienTai(1); }} 
        />
      </div>

      {isLoading ? <p className="loading-text">Đang tải dữ liệu...</p> : (
        <div className="book-grid">
          {danhSachSach.length > 0 ? (
            danhSachSach.map((sach) => (
              <div key={sach.id} className="book-card">
                <div className="book-image">
                  <img src={sach.image_url || 'https://placehold.co/300x400?text=No+Cover'} alt={sach.title} 
                       onError={(e) => (e.currentTarget.src = 'https://placehold.co/300x400?text=Error')} />
                  <div className={`status-badge ${sach.available_quantity > 0 ? 'available' : 'out-of-stock'}`}>
                    {sach.available_quantity > 0 ? 'Sẵn sàng' : 'Hết hàng'}
                  </div>
                </div>
                <div className="book-info">
                  <div className="book-meta">
                    <span className="book-category">{sach.ten_the_loai || 'Chưa phân loại'}</span>
                    <span className="book-year">{sach.published_year}</span>
                  </div>
                  <h3 className="book-title" title={sach.title}>{sach.title}</h3>
                  <p className="book-author">{sach.author}</p>
                  <div className="book-stats">
                    <div className="stat-item"><span className="label">Tổng</span><span className="value">{sach.total_quantity}</span></div>
                    <div className="stat-item"><span className="label">Còn</span><span className="value highlight">{sach.available_quantity}</span></div>
                  </div>
                  <div className="book-actions">
                    <button className="btn-action edit" onClick={() => openEditModal(sach)}><Edit size={16} /> Sửa</button>
                    <button className="btn-action delete" onClick={() => handleXoa(sach.id)}><Trash2 size={16} /> Xóa</button>
                  </div>
                </div>
              </div>
            ))
          ) : <p className="no-data">Không tìm thấy sách nào.</p>}
        </div>
      )}

      {tongSoTrang > 1 && (
        <div className="pagination">
          <button disabled={trangHienTai === 1} onClick={() => setTrangHienTai(t => t - 1)}>Trước</button>
          <span>Trang {trangHienTai} / {tongSoTrang}</span>
          <button disabled={trangHienTai === tongSoTrang} onClick={() => setTrangHienTai(t => t + 1)}>Sau</button>
        </div>
      )}

      {hienModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{dangSuaSach ? 'Cập Nhật Sách' : 'Thêm Sách Mới'}</h3>
            <form onSubmit={handleSubmit}>
              {}
              <div className="form-section">
                <h4 className="section-title">Thông tin cơ bản</h4>
                <div className="form-group">
                  <label>
                    Tên sách <span className="required">*</span>
                  </label>
                  <input 
                    required 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="Nhập tên sách..."
                  />
                </div>
                <div className="form-group">
                  <label>
                    Tác giả <span className="required">*</span>
                  </label>
                  <input 
                    required 
                    value={formData.author} 
                    onChange={e => setFormData({...formData, author: e.target.value})}
                    placeholder="Nhập tên tác giả..."
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Thể loại</label>
                    <select 
                      value={formData.category_id || ''} 
                      onChange={e => setFormData({...formData, category_id: e.target.value ? Number(e.target.value) : 0})}
                    >
                      <option value="">-- Chọn thể loại --</option>
                      {danhSachTheLoai.map(tl => (
                        <option key={tl.category_id} value={tl.category_id}>{tl.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Năm xuất bản</label>
                    <input 
                      type="number" 
                      min="1000" 
                      max={new Date().getFullYear() + 1}
                      value={formData.published_year || ''} 
                      onChange={e => setFormData({...formData, published_year: e.target.value ? Number(e.target.value) : undefined})}
                      placeholder="VD: 2024"
                    />
                  </div>
                </div>
              </div>

              {}
              <div className="form-section">
                <h4 className="section-title">Hình ảnh</h4>
                <div className="form-group">
                  <label>Link ảnh bìa</label>
                  <div className="image-preview-container">
                    <input 
                      type="url"
                      value={formData.image_url} 
                      onChange={e => setFormData({...formData, image_url: e.target.value})} 
                      placeholder="https://example.com/image.jpg"
                    />
                    {formData.image_url && (
                      <img 
                        src={formData.image_url} 
                        alt="Preview" 
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                  <p className="field-hint">Để trống sẽ sử dụng ảnh mặc định</p>
                </div>
              </div>

              {}
              <div className="form-section">
                <h4 className="section-title">Quản lý số lượng</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Tổng số lượng <span className="required">*</span>
                    </label>
                    <input 
                      required 
                      type="number" 
                      min="0"
                      value={formData.total_quantity} 
                      onChange={e => {
                        const val = Number(e.target.value);
                        setFormData({
                          ...formData, 
                          total_quantity: val,
                          available_quantity: Math.min(formData.available_quantity, val)
                        });
                      }}
                      placeholder="0"
                    />
                    <p className="field-hint">Tổng số cuốn sách có trong thư viện</p>
                  </div>
                  <div className="form-group">
                    <label>
                      Số lượng có sẵn <span className="required">*</span>
                    </label>
                    <input 
                      required 
                      type="number" 
                      min="0"
                      max={formData.total_quantity}
                      value={formData.available_quantity} 
                      onChange={e => {
                        const val = Number(e.target.value);
                        if (val <= formData.total_quantity) {
                          setFormData({...formData, available_quantity: val});
                        }
                      }}
                      placeholder="0"
                    />
                    <p className="field-hint">Số cuốn có thể cho mượn</p>
                  </div>
                </div>
                {formData.total_quantity > 0 && (
                  <div className="quantity-info">
                    <span className="info-label">Đang mượn:</span>
                    <span className="info-value">{formData.total_quantity - formData.available_quantity} cuốn</span>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setHienModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-save">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuanLySach;