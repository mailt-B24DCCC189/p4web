import React, { useState, useEffect, useRef } from 'react';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { apiThuVien } from '@/api/apiThuVien';
import { CheckCircle, XCircle } from 'lucide-react';
import './BorrowModal.css';

interface BorrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Optional callback
  borrow?: any; // Nếu có thì là edit mode, không có thì là create mode
}

const BorrowModal: React.FC<BorrowModalProps> = ({ isOpen, onClose, onSuccess, borrow }) => {
  const [formData, setFormData] = useState({
    reader_id: '',
    book_id: '',
    borrow_date: '',
    due_date: ''
  });
  const [readerSearch, setReaderSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [readers, setReaders] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [filteredReaders, setFilteredReaders] = useState<any[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<any[]>([]);
  const [showReaderDropdown, setShowReaderDropdown] = useState(false);
  const [showBookDropdown, setShowBookDropdown] = useState(false);
  const [selectedReader, setSelectedReader] = useState<any>(null);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [searchingBooks, setSearchingBooks] = useState(false);
  const [error, setError] = useState('');
  
  const readerDropdownRef = useRef<HTMLDivElement>(null);
  const bookDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadReadersAndBooks();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (borrow) {
        setFormData({
          reader_id: borrow.reader_id?.toString() || '',
          book_id: borrow.book_id?.toString() || '',
          borrow_date: borrow.borrow_date ? new Date(borrow.borrow_date).toISOString().split('T')[0] : '',
          due_date: borrow.due_date ? new Date(borrow.due_date).toISOString().split('T')[0] : ''
        });
        if (borrow.reader_id) {
          setSelectedReader({
            reader_id: borrow.reader_id,
            full_name: borrow.reader_name,
            email: borrow.reader_email
          });
          setReaderSearch(borrow.reader_name || '');
        }
        if (borrow.book_id) {
          setSelectedBook({
            book_id: borrow.book_id,
            title: borrow.book_title,
            author: borrow.book_author,
            available_quantity: borrow.available_quantity || 0
          });
          setBookSearch(borrow.book_title || '');
        }
      } else {
        const today = new Date().toISOString().split('T')[0];
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);
        setFormData({
          reader_id: '',
          book_id: '',
          borrow_date: today,
          due_date: dueDate.toISOString().split('T')[0]
        });
        setReaderSearch('');
        setBookSearch('');
        setSelectedReader(null);
        setSelectedBook(null);
      }
      setError('');
    }
  }, [isOpen, borrow]);

  useEffect(() => {
    if (formData.borrow_date && !borrow) {
      const selected = new Date(formData.borrow_date);
      const due = new Date(selected);
      due.setDate(due.getDate() + 14); // Mặc định 14 ngày
      setFormData(prev => ({
        ...prev,
        due_date: due.toISOString().split('T')[0]
      }));
    }
  }, [formData.borrow_date, borrow]);

  useEffect(() => {
    if (readerSearch.trim()) {
      const filtered = readers.filter(reader => 
        reader.full_name?.toLowerCase().includes(readerSearch.toLowerCase()) ||
        reader.email?.toLowerCase().includes(readerSearch.toLowerCase()) ||
        reader.phone?.includes(readerSearch)
      );
      setFilteredReaders(filtered.slice(0, 10)); // Giới hạn 10 kết quả
      setShowReaderDropdown(true);
    } else {
      setFilteredReaders([]);
      setShowReaderDropdown(false);
    }
  }, [readerSearch, readers]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (bookSearch.trim()) {
        searchBooks(bookSearch);
      } else {
        setFilteredBooks([]);
        setShowBookDropdown(false);
        setBooks([]);
        setSearchingBooks(false);
      }
    }, 500); // Debounce 500ms để tránh gọi API quá nhiều

    return () => clearTimeout(timeoutId);
  }, [bookSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (readerDropdownRef.current && !readerDropdownRef.current.contains(event.target as Node)) {
        setShowReaderDropdown(false);
      }
      if (bookDropdownRef.current && !bookDropdownRef.current.contains(event.target as Node)) {
        setShowBookDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadReadersAndBooks = async () => {
    try {
      setLoadingData(true);
      const readersData = await apiThuVien.getAllReaders(1, 100, '');
      setReaders(readersData.readers || []);
      setBooks([]); // Không load sách ban đầu
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const searchBooks = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredBooks([]);
      setShowBookDropdown(false);
      setSearchingBooks(false);
      return;
    }

    try {
      setSearchingBooks(true);
      const booksData = await apiThuVien.layDanhSachSach(1, searchTerm);
      const booksList = booksData.duLieu || booksData.books || [];
      setBooks(booksList);
      setFilteredBooks(booksList.slice(0, 20)); // Hiển thị tối đa 20 kết quả
      setShowBookDropdown(true);
    } catch (error) {
      console.error('Lỗi khi tìm kiếm sách:', error);
      setFilteredBooks([]);
      setShowBookDropdown(false);
    } finally {
      setSearchingBooks(false);
    }
  };

  const handleSelectReader = (reader: any) => {
    setSelectedReader(reader);
    setFormData(prev => ({ ...prev, reader_id: reader.reader_id.toString() }));
    setReaderSearch(reader.full_name);
    setShowReaderDropdown(false);
  };

  const handleSelectBook = (book: any) => {
    setSelectedBook(book);
    setFormData(prev => ({ ...prev, book_id: book.book_id.toString() }));
    setBookSearch(book.title);
    setShowBookDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.reader_id || !formData.book_id) {
      setError('Vui lòng chọn bạn đọc và sách');
      return;
    }

    if (!formData.borrow_date || !formData.due_date) {
      setError('Vui lòng chọn ngày mượn và hạn trả');
      return;
    }

    setLoading(true);

    try {
      if (borrow) {
        await apiThuVien.updateBorrow(borrow.borrow_id, {
          due_date: formData.due_date,
          borrow_date: formData.borrow_date
        });
      } else {
        await apiThuVien.createBorrow({
          reader_id: parseInt(formData.reader_id),
          book_id: parseInt(formData.book_id),
          borrow_date: formData.borrow_date,
          due_date: formData.due_date
        });
      }

      if (onSuccess) {
        onSuccess();
      }
      window.dispatchEvent(new CustomEvent('borrow:changed'));

      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra';
      setError(errorMessage);
      console.error('Lỗi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (field: string, value: string) => {
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
      title={borrow ? 'Sửa phiếu mượn' : 'Tạo phiếu mượn mới'}
    >
      <form onSubmit={handleSubmit} className="borrow-modal-form">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loadingData ? (
          <div className="loading-data">Đang tải dữ liệu...</div>
        ) : (
          <>
            {}
            <div className="form-group search-group" ref={readerDropdownRef}>
              <label>Bạn đọc <span className="required">*</span></label>
              <div className="search-input-wrapper">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Nhập tên, email hoặc số điện thoại bạn đọc..."
                  value={readerSearch}
                  onChange={(e) => {
                    setReaderSearch(e.target.value);
                    if (selectedReader) {
                      setSelectedReader(null);
                      setFormData(prev => ({ ...prev, reader_id: '' }));
                    }
                  }}
                  disabled={!!borrow}
                  required
                />
                {selectedReader && (
                  <button
                    type="button"
                    className="clear-selection"
                    onClick={() => {
                      setSelectedReader(null);
                      setReaderSearch('');
                      setFormData(prev => ({ ...prev, reader_id: '' }));
                    }}
                    disabled={!!borrow}
                  >
                    ×
                  </button>
                )}
              </div>
              {showReaderDropdown && filteredReaders.length > 0 && (
                <div className="search-dropdown">
                  {filteredReaders.map((reader) => (
                    <div
                      key={reader.reader_id}
                      className="dropdown-item"
                      onClick={() => handleSelectReader(reader)}
                    >
                      <div className="item-info">
                        <strong>{reader.full_name}</strong>
                        {reader.email && <span className="item-subtitle">{reader.email}</span>}
                        {reader.phone && <span className="item-subtitle">{reader.phone}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {readerSearch && filteredReaders.length === 0 && (
                <div className="search-dropdown empty">
                  <div className="dropdown-item">Không tìm thấy bạn đọc</div>
                </div>
              )}
            </div>

            {}
            <div className="form-group search-group" ref={bookDropdownRef}>
              <label>Sách <span className="required">*</span></label>
              <div className="search-input-wrapper">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Nhập tên sách hoặc tác giả..."
                  value={bookSearch}
                  onChange={(e) => {
                    setBookSearch(e.target.value);
                    if (selectedBook) {
                      setSelectedBook(null);
                      setFormData(prev => ({ ...prev, book_id: '' }));
                    }
                  }}
                  disabled={!!borrow}
                  required
                />
                {selectedBook && (
                  <button
                    type="button"
                    className="clear-selection"
                    onClick={() => {
                      setSelectedBook(null);
                      setBookSearch('');
                      setFormData(prev => ({ ...prev, book_id: '' }));
                    }}
                    disabled={!!borrow}
                  >
                    ×
                  </button>
                )}
              </div>
              {showBookDropdown && filteredBooks.length > 0 && (
                <div className="search-dropdown">
                  {filteredBooks.map((book) => {
                    const bookId = book.book_id || book.id;
                    const availableQty = book.available_quantity || 0;
                    const isAvailable = availableQty > 0;
                    return (
                      <div
                        key={bookId}
                        className={`dropdown-item ${!isAvailable ? 'unavailable' : ''}`}
                        onClick={() => isAvailable && handleSelectBook({ ...book, book_id: bookId })}
                      >
                        <div className="item-info">
                          <div className="item-header">
                            <strong>{book.title}</strong>
                            <span className={`status-badge ${isAvailable ? 'available' : 'unavailable'}`}>
                              {isAvailable ? (
                                <>
                                  <CheckCircle size={14} /> Còn {availableQty} cuốn
                                </>
                              ) : (
                                <>
                                  <XCircle size={14} /> Hết sách
                                </>
                              )}
                            </span>
                          </div>
                          <span className="item-subtitle">Tác giả: {book.author}</span>
                          {(book.category_name || book.ten_the_loai) && (
                            <span className="item-tag">{book.category_name || book.ten_the_loai}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {bookSearch && !searchingBooks && filteredBooks.length === 0 && (
                <div className="search-dropdown empty">
                  <div className="dropdown-item">Không tìm thấy sách</div>
                </div>
              )}
              {bookSearch && searchingBooks && (
                <div className="search-dropdown">
                  <div className="dropdown-item">Đang tìm kiếm...</div>
                </div>
              )}
            </div>

            <div className="date-row">
              <div className="form-group">
                <label>Ngày mượn <span className="required">*</span></label>
                <input
                  type="date"
                  className="date-input"
                  value={formData.borrow_date}
                  onChange={(e) => handleDateChange('borrow_date', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Hạn trả <span className="required">*</span></label>
                <input
                  type="date"
                  className="date-input"
                  value={formData.due_date}
                  onChange={(e) => handleDateChange('due_date', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="modal-actions">
              <Button 
                type="button" 
                onClick={onClose} 
                disabled={loading}
                className="cancel-btn"
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="submit-btn"
              >
                {loading ? 'Đang xử lý...' : (borrow ? 'Cập nhật' : 'Tạo mới')}
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};

export default BorrowModal;
