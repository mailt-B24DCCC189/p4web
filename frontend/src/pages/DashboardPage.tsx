import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '@/redux/authSlice';
import { useNavigate } from 'react-router-dom';
import BorrowModal from '@/components/borrows/BorrowModal';
import { Plus, LogOut, Clock, BookOpen, Users, ReceiptText, AlertTriangle, BarChart3, ArrowRight } from 'lucide-react';
import './DashboardPage.css';
import { apiThuVien } from '@/api/apiThuVien';

const DashboardPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: any) => state.auth.user);
  const [modalOpen, setModalOpen] = useState(false);
  
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const loadOverview = async () => {
    try {
      setLoading(true);
      const data = await apiThuVien.getOverview();
      setOverview(data);
    } catch (error) {
      console.error("Lỗi lấy thống kê:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivities = async () => {
    try {
      setLoadingActivities(true);
      const data = await apiThuVien.getRecentActivities(20);
      const sorted = (data || []).sort((a: any, b: any) => {
        const tA = new Date(a.activity_date).getTime();
        const tB = new Date(b.activity_date).getTime();
        if (tA !== tB) return tB - tA;
        return (b.borrow_id || 0) - (a.borrow_id || 0);
      });
      setRecentActivities(sorted);
    } catch (error) {
      console.error("Lỗi lấy hoạt động gần đây:", error);
      setRecentActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    loadOverview();
    loadRecentActivities();

    const handleBorrowChanged = () => {
      loadOverview();
      loadRecentActivities();
    };

    window.addEventListener('borrow:changed', handleBorrowChanged);
    return () => {
      window.removeEventListener('borrow:changed', handleBorrowChanged);
    };
  }, []);

  return (
    <div className="dashboard-page">
      {}
      <div className="dashboard-header">
        <div>
          <h1>Chào mừng quay trở lại, {user?.full_name || 'Quản trị viên'}!</h1>
          <p className="dashboard-date">
            <Clock size={18} /> {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="header-actions">
          <button 
            onClick={() => navigate('/statistics')} 
            className="statistics-header-btn"
            title="Xem thống kê chi tiết"
          >
            <BarChart3 size={20} /> Thống kê
          </button>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} /> Đăng xuất
          </button>
        </div>
      </div>
      
      {}
      <div className="stats-grid">
        {}
        <div 
          className="stat-card indigo" 
          onClick={() => navigate('/books')}
          style={{ cursor: 'pointer' }}
        >
          <BookOpen size={40} />
          <div>
            <h3>{loading ? '...' : (overview?.total_books || 0)}</h3>
            <p>Tổng số đầu sách</p>
          </div>
          <span className="stat-growth up">SQL</span>
        </div>

        <div 
          className="stat-card teal"
          onClick={() => navigate('/readers')}
          style={{ cursor: 'pointer' }}
        >
          <Users size={40} />
          <div>
            <h3>{loading ? '...' : (overview?.total_readers || 0)}</h3>
            <p>Thành viên</p>
          </div>
          <span className="stat-growth up">Thực tế</span>
        </div>
        <div 
          className="stat-card amber"
          onClick={() => navigate('/borrows/current')}
          style={{ cursor: 'pointer' }}
        >
          <ReceiptText size={40} />
          <div>
            <h3>{loading ? '...' : (overview?.total_borrowing || 0)}</h3>
            <p>Đang mượn</p>
          </div>
          <span className="stat-growth up">Thực tế</span>
        </div>
        <div 
          className="stat-card red"
          onClick={() => navigate('/borrows/overdue')}
          style={{ cursor: 'pointer' }}
        >
          <AlertTriangle size={40} />
          <div>
            <h3>{loading ? '...' : (overview?.total_overdue || 0)}</h3>
            <p>Quá hạn</p>
          </div>
          <span className="stat-growth down">Cần xử lý</span>
        </div>

        {}
        <div 
          className="stat-card statistics-btn" 
          onClick={() => navigate('/statistics')}
          style={{ cursor: 'pointer' }}
        >
          <BarChart3 size={40} />
          <div style={{ flex: 1 }}>
            <h3>Xem thống kê</h3>
            <p>Chi tiết đầy đủ</p>
          </div>
          <ArrowRight size={24} className="arrow-icon" />
        </div>
      </div>

      {}
      <div className="recent-activity">
        <h2>Hoạt động gần đây</h2>
        {loadingActivities ? (
          <div className="loading-activities">Đang tải hoạt động...</div>
        ) : recentActivities.length === 0 ? (
          <div className="empty-activities">Chưa có hoạt động nào</div>
        ) : (
          <div className="recent-activity-grid">
            <div className="activity-column">
              <h3>Trả sách</h3>
              <div className="activity-list">
                {recentActivities
                  .filter((a) => a.activity_type === 'return')
                  .map((activity) => (
                    <div key={`return-${activity.borrow_id}-${activity.activity_date}`} className="activity-item">
                      <strong>{activity.reader_name}</strong> {activity.action_text}{' '}
                      <em>{`“${activity.book_title}”`}</em>
                    </div>
                  ))}
                {recentActivities.filter((a) => a.activity_type === 'return').length === 0 && (
                  <div className="empty-activities">Chưa có trả sách</div>
                )}
              </div>
            </div>
            <div className="activity-column">
              <h3>Mượn sách</h3>
              <div className="activity-list">
                {recentActivities
                  .filter((a) => a.activity_type === 'borrow')
                  .map((activity) => (
                    <div key={`borrow-${activity.borrow_id}-${activity.activity_date}`} className="activity-item">
                      <strong>{activity.reader_name}</strong> {activity.action_text}{' '}
                      <em>{`“${activity.book_title}”`}</em>
                    </div>
                  ))}
                {recentActivities.filter((a) => a.activity_type === 'borrow').length === 0 && (
                  <div className="empty-activities">Chưa có mượn sách</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {}
      <button 
        onClick={() => setModalOpen(true)} 
        className="fab-button"
        title="Tạo phiếu mượn mới"
      >
        <Plus size={32} />
      </button>

      <BorrowModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          loadOverview();
          loadRecentActivities();
        }}
      />
    </div>
  );
};

export default DashboardPage;