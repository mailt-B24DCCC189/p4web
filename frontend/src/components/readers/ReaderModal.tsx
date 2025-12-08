import React, { useState, useEffect } from 'react';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { apiThuVien } from '@/api/apiThuVien';
import './ReaderModal.css';

interface ReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reader?: any; // Nếu có thì là edit mode, không có thì là create mode
}

const ReaderModal: React.FC<ReaderModalProps> = ({ isOpen, onClose, onSuccess, reader }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    max_quota: 5
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (reader) {
        setFormData({
          full_name: reader.full_name || '',
          email: reader.email || '',
          phone: reader.phone || '',
          address: reader.address || '',
          max_quota: reader.max_quota || 5
        });
      } else {
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          address: '',
          max_quota: 5
        });
      }
      setError('');
    }
  }, [isOpen, reader]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.full_name || formData.full_name.trim() === '') {
      setError('Họ tên không được để trống');
      return;
    }

    setLoading(true);

    try {
      if (reader) {
        await apiThuVien.updateReader(reader.reader_id, formData);
      } else {
        const createData = {
          full_name: formData.full_name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          address: formData.address.trim() || null,
          max_quota: formData.max_quota || 5
        };
        await apiThuVien.createReader(createData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra';
      setError(errorMessage);
      console.error('Lỗi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) {
      setError('');
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={reader ? 'Sửa thông tin thành viên' : 'Thêm thành viên mới'}
    >
      <form onSubmit={handleSubmit} className="reader-modal-form">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-group">
          <label>Họ và tên <span className="required">*</span></label>
          <Input
            placeholder="Nhập họ và tên"
            value={formData.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <Input
            type="email"
            placeholder="Nhập email (tùy chọn)"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Số điện thoại</label>
          <Input
            type="tel"
            placeholder="Nhập số điện thoại (tùy chọn)"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Địa chỉ</label>
          <textarea
            className="form-textarea"
            placeholder="Nhập địa chỉ (tùy chọn)"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>Số sách tối đa được mượn</label>
          <Input
            type="number"
            min="1"
            max="20"
            placeholder="Mặc định: 5"
            value={formData.max_quota.toString()}
            onChange={(e) => handleChange('max_quota', parseInt(e.target.value) || 5)}
          />
        </div>

        <div className="form-actions">
          <Button type="button" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Đang xử lý...' : (reader ? 'Cập nhật' : 'Tạo mới')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ReaderModal;



