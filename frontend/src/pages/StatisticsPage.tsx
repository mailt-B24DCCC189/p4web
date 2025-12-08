import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, TrendingUp, BarChart3, AlertTriangle, Package, ArrowLeft } from 'lucide-react';
import { apiThuVien } from '@/api/apiThuVien';
import './StatisticsPage.css';

const StatisticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [mostBorrowedBooks, setMostBorrowedBooks] = useState<any[]>([]);
  const [mostBorrowingReaders, setMostBorrowingReaders] = useState<any[]>([]);
  const [stockStatus, setStockStatus] = useState<any>(null);
  const [overdueBooks, setOverdueBooks] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    loadAllStatistics();
  }, [period]);

  const loadAllStatistics = async () => {
    try {
      setLoading(true);
      const [
        overviewData,
        booksData,
        readersData,
        stockData,
        overdueData,
        categoryData,
        trendsData
      ] = await Promise.all([
        apiThuVien.getOverview(),
        apiThuVien.getMostBorrowedBooks(10),
        apiThuVien.getMostBorrowingReaders(10),
        apiThuVien.getStockStatus(),
        apiThuVien.getOverdueBooks(),
        apiThuVien.getCategoryStats(),
        apiThuVien.getBorrowTrends(period)
      ]);

      setOverview(overviewData);
      setMostBorrowedBooks(booksData);
      setMostBorrowingReaders(readersData);
      setStockStatus(stockData);
      setOverdueBooks(overdueData);
      setCategoryStats(categoryData);
      setTrends(trendsData);
    } catch (error) {
      console.error('Lỗi khi tải thống kê:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="statistics-page">
        <div className="loading">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="statistics-page">
      <div className="stats-header">
        <div className="header-left">
          <button 
            className="back-button" 
            onClick={() => navigate('/dashboard')}
            title="Quay lại Dashboard"
          >
            <ArrowLeft size={20} /> Quay lại
          </button>
          <h1>
            <BarChart3 size={32} /> Thống Kê Hệ Thống
          </h1>
        </div>
        <div className="period-selector">
          <button
            className={period === 'week' ? 'active' : ''}
            onClick={() => setPeriod('week')}
          >
            Tuần
          </button>
          <button
            className={period === 'month' ? 'active' : ''}
            onClick={() => setPeriod('month')}
          >
            Tháng
          </button>
        </div>
      </div>

      {}
      <div className="stats-section">
        <h2>
          <TrendingUp size={24} /> Tổng Quan
        </h2>
        <div className="overview-grid">
          <div className="overview-card">
            <BookOpen size={28} />
            <div>
              <h3>{overview?.total_books || 0}</h3>
              <p>Đầu sách</p>
            </div>
          </div>
          <div className="overview-card">
            <Users size={28} />
            <div>
              <h3>{overview?.total_readers || 0}</h3>
              <p>Bạn đọc</p>
            </div>
          </div>
          <div className="overview-card">
            <Package size={28} />
            <div>
              <h3>{overview?.total_borrowing || 0}</h3>
              <p>Đang mượn</p>
            </div>
          </div>
          <div className="overview-card">
            <AlertTriangle size={28} />
            <div>
              <h3>{overview?.total_overdue || 0}</h3>
              <p>Quá hạn</p>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="stats-section">
        <h2>
          <BookOpen size={24} /> Top 10 Sách Được Mượn Nhiều Nhất
        </h2>
        <div className="table-container">
          <table className="stats-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên sách</th>
                <th>Tác giả</th>
                <th>Thể loại</th>
                <th>Số lượt mượn</th>
                <th>Còn lại</th>
              </tr>
            </thead>
            <tbody>
              {mostBorrowedBooks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty">Chưa có dữ liệu</td>
                </tr>
              ) : (
                mostBorrowedBooks.map((book, index) => (
                  <tr key={book.book_id}>
                    <td>{index + 1}</td>
                    <td><strong>{book.title}</strong></td>
                    <td>{book.author}</td>
                    <td>{book.category_name || 'N/A'}</td>
                    <td><span className="badge">{book.borrow_count}</span></td>
                    <td>{book.available_quantity}/{book.total_quantity}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {}
      <div className="stats-section">
        <h2>
          <Users size={24} /> Top 10 Bạn Đọc Mượn Nhiều Nhất
        </h2>
        <div className="table-container">
          <table className="stats-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Tổng lượt mượn</th>
                <th>Đang mượn</th>
                <th>Đã trả</th>
              </tr>
            </thead>
            <tbody>
              {mostBorrowingReaders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty">Chưa có dữ liệu</td>
                </tr>
              ) : (
                mostBorrowingReaders.map((reader, index) => (
                  <tr key={reader.reader_id}>
                    <td>{index + 1}</td>
                    <td><strong>{reader.full_name}</strong></td>
                    <td>{reader.email || 'N/A'}</td>
                    <td>{reader.phone || 'N/A'}</td>
                    <td><span className="badge">{reader.total_borrows}</span></td>
                    <td>{reader.current_borrows}</td>
                    <td>{reader.returned_borrows}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {}
      {stockStatus && (
        <div className="stats-section">
          <h2>
            <Package size={24} /> Tình Trạng Kho
          </h2>
          <div className="stock-info">
            <div className="stock-card">
              <h3>Tổng số lượng sách</h3>
              <p className="big-number">{stockStatus.overview?.total_quantity || 0}</p>
            </div>
            <div className="stock-card">
              <h3>Còn sẵn</h3>
              <p className="big-number">{stockStatus.overview?.total_available || 0}</p>
            </div>
            <div className="stock-card">
              <h3>Đang mượn</h3>
              <p className="big-number">{stockStatus.overview?.total_borrowed || 0}</p>
            </div>
            <div className="stock-card">
              <h3>Tỷ lệ sẵn có</h3>
              <p className="big-number">{stockStatus.overview?.availability_rate || 0}%</p>
            </div>
          </div>

          {stockStatus.lowStock && stockStatus.lowStock.length > 0 && (
            <div className="warning-section">
              <h3>
                <AlertTriangle size={20} /> Sách sắp hết (dưới 5 cuốn)
              </h3>
              <div className="table-container">
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>Tên sách</th>
                      <th>Tác giả</th>
                      <th>Còn lại</th>
                      <th>Tổng số</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockStatus.lowStock.map((book: any) => (
                      <tr key={book.book_id}>
                        <td><strong>{book.title}</strong></td>
                        <td>{book.author}</td>
                        <td className="warning">{book.available_quantity}</td>
                        <td>{book.total_quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {}
      {overdueBooks.length > 0 && (
        <div className="stats-section">
          <h2>
            <AlertTriangle size={24} /> Sách Quá Hạn ({overdueBooks.length})
          </h2>
          <div className="table-container">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Bạn đọc</th>
                  <th>Sách</th>
                  <th>Ngày mượn</th>
                  <th>Hạn trả</th>
                  <th>Quá hạn (ngày)</th>
                </tr>
              </thead>
              <tbody>
                {overdueBooks.map((item: any) => (
                  <tr key={item.borrow_id} className="overdue-row">
                    <td><strong>{item.reader_name}</strong></td>
                    <td>{item.book_title}</td>
                    <td>{new Date(item.borrow_date).toLocaleDateString('vi-VN')}</td>
                    <td>{new Date(item.due_date).toLocaleDateString('vi-VN')}</td>
                    <td className="overdue">{item.days_overdue} ngày</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {}
      {categoryStats.length > 0 && (
        <div className="stats-section">
          <h2>
            <BarChart3 size={24} /> Thống Kê Theo Thể Loại
          </h2>
          <div className="table-container">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Thể loại</th>
                  <th>Số đầu sách</th>
                  <th>Tổng lượt mượn</th>
                  <th>Số bạn đọc</th>
                </tr>
              </thead>
              <tbody>
                {categoryStats.map((cat: any) => (
                  <tr key={cat.category_id}>
                    <td><strong>{cat.category_name}</strong></td>
                    <td>{cat.total_books}</td>
                    <td><span className="badge">{cat.total_borrows}</span></td>
                    <td>{cat.unique_readers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsPage;

