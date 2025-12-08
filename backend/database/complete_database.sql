
CREATE DATABASE IF NOT EXISTS quan_ly_thu_vien;
USE quan_ly_thu_vien;


CREATE TABLE IF NOT EXISTS Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    full_name VARCHAR(150),
    avatar VARCHAR(255) DEFAULT 'https://placehold.co/100x100?text=Avatar',
    role ENUM('ADMIN', 'LIBRARIAN') NOT NULL DEFAULT 'LIBRARIAN',
    provider VARCHAR(50) DEFAULT 'local',
    provider_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS Books (
    book_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    category_id INT,
    total_quantity INT NOT NULL DEFAULT 0,
    available_quantity INT NOT NULL DEFAULT 0,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    published_year INT,
    image_url VARCHAR(500) DEFAULT 'https://placehold.co/300x400?text=No+Image',
    FOREIGN KEY (category_id) REFERENCES Categories(category_id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Readers (
    reader_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    max_quota INT NOT NULL DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS BorrowRecords (
    borrow_id INT PRIMARY KEY AUTO_INCREMENT,
    reader_id INT NOT NULL,
    book_id INT NOT NULL,
    borrow_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME NOT NULL,
    return_date DATETIME,
    status ENUM('BORROWING', 'RETURNED', 'OVERDUE') NOT NULL DEFAULT 'BORROWING',
    FOREIGN KEY (reader_id) REFERENCES Readers(reader_id),
    FOREIGN KEY (book_id) REFERENCES Books(book_id)
);

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE BorrowRecords;
TRUNCATE TABLE Books;
TRUNCATE TABLE Readers;
TRUNCATE TABLE Categories;
SET FOREIGN_KEY_CHECKS = 1;


INSERT INTO Categories (name, description) VALUES
('Tiểu thuyết', 'Sách văn học tiểu thuyết trong và ngoài nước'),
('Khoa học', 'Sách khoa học tự nhiên và xã hội'),
('Truyện tranh', 'Manga, Comic giải trí'),
('Sách giáo khoa', 'Sách dùng cho học sinh phổ thông'),
('Tâm lý - Kỹ năng sống', 'Sách self-help, phát triển bản thân');

INSERT INTO Books (title, author, category_id, total_quantity, available_quantity, published_year, image_url, is_hidden) VALUES
('Tôi thấy hoa vàng trên cỏ xanh', 'Nguyễn Nhật Ánh', 1, 10, 8, 2010, 'https://placehold.co/300x400?text=Tôi+thấy+hoa+vàng', 0),
('Mắt Biếc', 'Nguyễn Nhật Ánh', 1, 20, 15, 2019, 'https://placehold.co/300x400?text=Mắt+Biếc', 0),
('Số Đỏ', 'Vũ Trọng Phụng', 1, 15, 15, 1936, 'https://placehold.co/300x400?text=Số+Đỏ', 0),
('Dế Mèn Phiêu Lưu Ký', 'Tô Hoài', 1, 30, 28, 1941, 'https://placehold.co/300x400?text=Dế+Mèn', 0),
('Rừng Na Uy', 'Haruki Murakami', 1, 12, 5, 1987, 'https://placehold.co/300x400?text=Rừng+Na+Uy', 0),
('Harry Potter và Hòn Đá Phù Thủy', 'J.K. Rowling', 1, 50, 2, 1997, 'https://placehold.co/300x400?text=Harry+Potter', 0),
('Chí Phèo', 'Nam Cao', 1, 20, 20, 1941, 'https://placehold.co/300x400?text=Chí+Phèo', 0),
('Bố Già (The Godfather)', 'Mario Puzo', 1, 10, 8, 1969, 'https://placehold.co/300x400?text=Bố+Già', 0),
('Không Gia Đình', 'Hector Malot', 1, 18, 16, 1878, 'https://placehold.co/300x400?text=Không+Gia+Đình', 0),

('Vũ Trụ', 'Carl Sagan', 2, 10, 10, 1980, 'https://placehold.co/300x400?text=Vũ+Trụ', 0),
('Lược Sử Thời Gian', 'Stephen Hawking', 2, 25, 22, 1988, 'https://placehold.co/300x400?text=Lược+Sử', 0),
('Sapiens: Lược Sử Loài Người', 'Yuval Noah Harari', 2, 40, 35, 2011, 'https://placehold.co/300x400?text=Sapiens', 0),
('Gen: Lịch Sử Và Tương Lai', 'Siddhartha Mukherjee', 2, 8, 6, 2016, 'https://placehold.co/300x400?text=Gen', 0),
('Những Nền Văn Minh Thế Giới', 'Fernand Braudel', 2, 5, 5, 1993, 'https://placehold.co/300x400?text=Văn+Minh', 0),

('Doraemon tập 1', 'Fujiko F. Fujio', 3, 30, 25, 1974, 'https://placehold.co/300x400?text=Doraemon', 0),
('Thám Tử Lừng Danh Conan Tập 1', 'Gosho Aoyama', 3, 50, 45, 1994, 'https://placehold.co/300x400?text=Conan', 0),
('Doraemon Truyện Ngắn Tập 10', 'Fujiko F. Fujio', 3, 60, 50, 1975, 'https://placehold.co/300x400?text=Doraemon+10', 0),
('One Piece Tập 100', 'Eiichiro Oda', 3, 45, 10, 2021, 'https://placehold.co/300x400?text=One+Piece', 0),
('Naruto Tập 72', 'Masashi Kishimoto', 3, 30, 30, 2015, 'https://placehold.co/300x400?text=Naruto', 0),
('Thần Đồng Đất Việt 1', 'Lê Linh', 3, 40, 38, 2002, 'https://placehold.co/300x400?text=Thần+Đồng', 0),
('Dragon Ball Tập 42', 'Akira Toriyama', 3, 25, 20, 1995, 'https://placehold.co/300x400?text=Dragon+Ball', 0),

('Vật lý 11', 'Nhiều tác giả', 4, 50, 48, 2020, 'https://placehold.co/300x400?text=Vật+Lý+11', 0),
('Toán 12 (Tập 1)', 'Bộ Giáo Dục', 4, 100, 90, 2023, 'https://placehold.co/300x400?text=Toán+12', 0),
('Ngữ Văn 11 (Tập 2)', 'Bộ Giáo Dục', 4, 80, 75, 2023, 'https://placehold.co/300x400?text=Ngữ+Văn+11', 0),
('Vật Lý 10', 'Bộ Giáo Dục', 4, 70, 68, 2023, 'https://placehold.co/300x400?text=Vật+Lý+10', 0),
('Tiếng Anh 12 Global Success', 'Bộ Giáo Dục', 4, 90, 85, 2024, 'https://placehold.co/300x400?text=Tiếng+Anh+12', 0),
('Lịch Sử 12', 'Bộ Giáo Dục', 4, 50, 50, 2023, 'https://placehold.co/300x400?text=Lịch+Sử+12', 0),

('Đắc nhân tâm', 'Dale Carnegie', 5, 15, 12, 1936, 'https://placehold.co/300x400?text=Đắc+nhân+tâm', 0),
('Nhà giả kim', 'Paulo Coelho', 5, 20, 20, 1988, 'https://placehold.co/300x400?text=Nhà+giả+kim', 0),
('Quẳng Gánh Lo Đi Và Vui Sống', 'Dale Carnegie', 5, 35, 30, 1948, 'https://placehold.co/300x400?text=Quẳng+Gánh+Lo', 0),
('Tuổi Trẻ Đáng Giá Bao Nhiêu', 'Rosie Nguyễn', 5, 40, 39, 2016, 'https://placehold.co/300x400?text=Tuổi+Trẻ', 0),
('Đời Thay Đổi Khi Chúng Ta Thay Đổi', 'Andrew Matthews', 5, 20, 18, 1988, 'https://placehold.co/300x400?text=Đời+Thay+Đổi', 0),
('Hiểu Về Trái Tim', 'Minh Niệm', 5, 30, 25, 2011, 'https://placehold.co/300x400?text=Hiểu+Về+Trái+Tim', 0),
('Cà Phê Cùng Tony', 'Tony Buổi Sáng', 5, 45, 40, 2015, 'https://placehold.co/300x400?text=Cà+Phê+Tony', 0),
('7 Thói Quen Của Người Thành Đạt', 'Stephen Covey', 5, 25, 22, 1989, 'https://placehold.co/300x400?text=7+Thói+Quen', 0);

INSERT INTO Readers (full_name, email, phone, address, max_quota) VALUES
('Nguyễn Văn An', 'nguyenvanan@email.com', '0912345678', '123 Đường ABC, Quận 1, TP.HCM', 5),
('Trần Thị Bình', 'tranthibinh@email.com', '0923456789', '456 Đường XYZ, Quận 2, TP.HCM', 5),
('Lê Văn Cường', 'levancuong@email.com', '0934567890', '789 Đường DEF, Quận 3, TP.HCM', 5),
('Phạm Thị Dung', 'phamthidung@email.com', '0945678901', '321 Đường GHI, Quận 4, TP.HCM', 5),
('Hoàng Văn Em', 'hoangvanem@email.com', '0956789012', '654 Đường JKL, Quận 5, TP.HCM', 5);

INSERT INTO BorrowRecords (reader_id, book_id, borrow_date, due_date, return_date, status) VALUES
(1, 1, '2024-01-15 10:00:00', '2024-01-29 10:00:00', NULL, 'BORROWING'),
(2, 3, '2024-01-10 14:00:00', '2024-01-24 14:00:00', '2024-01-20 15:00:00', 'RETURNED'),
(3, 5, '2024-01-05 09:00:00', '2024-01-19 09:00:00', NULL, 'OVERDUE'),
(1, 6, '2024-01-20 11:00:00', '2024-02-03 11:00:00', NULL, 'BORROWING'),
(4, 2, '2024-01-12 13:00:00', '2024-01-26 13:00:00', '2024-01-25 14:00:00', 'RETURNED'),
(2, 7, '2024-01-18 16:00:00', '2024-02-01 16:00:00', NULL, 'BORROWING'),
(5, 4, '2024-01-08 08:00:00', '2024-01-22 08:00:00', NULL, 'OVERDUE'),
(1, 10, '2024-01-22 09:00:00', '2024-02-05 09:00:00', NULL, 'BORROWING'),
(3, 12, '2024-01-14 10:00:00', '2024-01-28 10:00:00', '2024-01-27 11:00:00', 'RETURNED'),
(4, 15, '2024-01-16 15:00:00', '2024-01-30 15:00:00', NULL, 'BORROWING');

SELECT 'Categories:' as 'Table', COUNT(*) as 'Count' FROM Categories
UNION ALL
SELECT 'Books:', COUNT(*) FROM Books
UNION ALL
SELECT 'Readers:', COUNT(*) FROM Readers
UNION ALL
SELECT 'BorrowRecords:', COUNT(*) FROM BorrowRecords
UNION ALL
SELECT 'Users:', COUNT(*) FROM Users;

SELECT '✅ Database đã được setup thành công!' as 'Status';


SELECT 
    (SELECT COUNT(*) FROM Books WHERE is_hidden = 0) AS total_books,
    (SELECT COUNT(*) FROM Readers) AS total_readers,
    (SELECT COUNT(*) FROM BorrowRecords WHERE status = 'BORROWING') AS total_borrowing,
    (SELECT COUNT(*) FROM BorrowRecords WHERE status = 'OVERDUE') AS total_overdue,
    (SELECT COUNT(*) FROM BorrowRecords WHERE status = 'RETURNED') AS total_returned,
    (SELECT SUM(total_quantity) FROM Books WHERE is_hidden = 0) AS total_books_quantity,
    (SELECT SUM(available_quantity) FROM Books WHERE is_hidden = 0) AS total_available_quantity;

SELECT 
    b.book_id,
    b.title,
    b.author,
    c.name AS category_name,
    b.total_quantity,
    b.available_quantity,
    COUNT(br.borrow_id) AS borrow_count
FROM Books b
LEFT JOIN BorrowRecords br ON b.book_id = br.book_id
LEFT JOIN Categories c ON b.category_id = c.category_id
WHERE b.is_hidden = 0
GROUP BY b.book_id, b.title, b.author, c.name, b.total_quantity, b.available_quantity
ORDER BY borrow_count DESC
LIMIT 10;

SELECT 
    r.reader_id,
    r.full_name,
    r.email,
    r.phone,
    COUNT(br.borrow_id) AS total_borrows,
    COUNT(CASE WHEN br.status = 'BORROWING' THEN 1 END) AS current_borrows,
    COUNT(CASE WHEN br.status = 'RETURNED' THEN 1 END) AS returned_borrows,
    COUNT(CASE WHEN br.status = 'OVERDUE' THEN 1 END) AS overdue_borrows
FROM Readers r
LEFT JOIN BorrowRecords br ON r.reader_id = br.reader_id
GROUP BY r.reader_id, r.full_name, r.email, r.phone
ORDER BY total_borrows DESC
LIMIT 10;

SELECT 
    DATE(br.borrow_date) AS date,
    COUNT(CASE WHEN br.borrow_date IS NOT NULL THEN 1 END) AS borrows_count,
    COUNT(CASE WHEN br.return_date IS NOT NULL THEN 1 END) AS returns_count
FROM BorrowRecords br
WHERE br.borrow_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY DATE(br.borrow_date)
ORDER BY date ASC;

SELECT 
    DATE_FORMAT(br.borrow_date, '%Y-%m') AS month,
    COUNT(CASE WHEN br.borrow_date IS NOT NULL THEN 1 END) AS borrows_count,
    COUNT(CASE WHEN br.return_date IS NOT NULL THEN 1 END) AS returns_count
FROM BorrowRecords br
WHERE br.borrow_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
GROUP BY DATE_FORMAT(br.borrow_date, '%Y-%m')
ORDER BY month ASC;

SELECT 
    COUNT(*) AS total_books,
    SUM(total_quantity) AS total_quantity,
    SUM(available_quantity) AS total_available,
    SUM(total_quantity - available_quantity) AS total_borrowed,
    ROUND(SUM(available_quantity) * 100.0 / NULLIF(SUM(total_quantity), 0), 2) AS availability_rate
FROM Books
WHERE is_hidden = 0;

SELECT 
    b.book_id,
    b.title,
    b.author,
    c.name AS category_name,
    b.total_quantity,
    b.available_quantity,
    (b.total_quantity - b.available_quantity) AS borrowed_quantity
FROM Books b
LEFT JOIN Categories c ON b.category_id = c.category_id
WHERE b.is_hidden = 0 
  AND b.available_quantity < 5
  AND b.available_quantity >= 0
ORDER BY b.available_quantity ASC;

SELECT 
    b.book_id,
    b.title,
    b.author,
    c.name AS category_name,
    b.total_quantity,
    b.available_quantity,
    (b.total_quantity - b.available_quantity) AS borrowed_quantity
FROM Books b
LEFT JOIN Categories c ON b.category_id = c.category_id
WHERE b.is_hidden = 0 
  AND b.available_quantity = 0
ORDER BY b.title ASC;

SELECT 
    c.category_id,
    c.name AS category_name,
    COUNT(b.book_id) AS book_count,
    SUM(b.total_quantity) AS total_quantity,
    SUM(b.available_quantity) AS available_quantity,
    ROUND(SUM(b.available_quantity) * 100.0 / NULLIF(SUM(b.total_quantity), 0), 2) AS availability_rate
FROM Categories c
LEFT JOIN Books b ON c.category_id = b.category_id AND b.is_hidden = 0
GROUP BY c.category_id, c.name
ORDER BY book_count DESC;

SELECT 
    br.borrow_id,
    br.borrow_date,
    br.due_date,
    br.return_date,
    DATEDIFF(CURDATE(), br.due_date) AS days_overdue,
    b.title AS book_title,
    b.author AS book_author,
    r.reader_id,
    r.full_name AS reader_name,
    r.email AS reader_email,
    r.phone AS reader_phone
FROM BorrowRecords br
INNER JOIN Books b ON br.book_id = b.book_id
INNER JOIN Readers r ON br.reader_id = r.reader_id
WHERE br.status = 'OVERDUE' 
   OR (br.status = 'BORROWING' AND br.due_date < CURDATE() AND br.return_date IS NULL)
ORDER BY days_overdue DESC;

SELECT 
    c.category_id,
    c.name AS category_name,
    COUNT(DISTINCT b.book_id) AS total_books,
    COUNT(br.borrow_id) AS total_borrows,
    COUNT(DISTINCT br.reader_id) AS unique_readers
FROM Categories c
LEFT JOIN Books b ON c.category_id = b.category_id AND b.is_hidden = 0
LEFT JOIN BorrowRecords br ON b.book_id = br.book_id
GROUP BY c.category_id, c.name
ORDER BY total_borrows DESC;

SELECT 
    YEAR(br.borrow_date) AS year,
    COUNT(CASE WHEN br.borrow_date IS NOT NULL THEN 1 END) AS borrows_count,
    COUNT(CASE WHEN br.return_date IS NOT NULL THEN 1 END) AS returns_count
FROM BorrowRecords br
WHERE YEAR(br.borrow_date) = YEAR(CURDATE())
GROUP BY YEAR(br.borrow_date);

SELECT 
    MONTH(br.borrow_date) AS month,
    DATE_FORMAT(br.borrow_date, '%Y-%m') AS month_name,
    COUNT(CASE WHEN br.borrow_date IS NOT NULL THEN 1 END) AS borrows_count,
    COUNT(CASE WHEN br.return_date IS NOT NULL THEN 1 END) AS returns_count
FROM BorrowRecords br
WHERE YEAR(br.borrow_date) = YEAR(CURDATE())
GROUP BY MONTH(br.borrow_date), DATE_FORMAT(br.borrow_date, '%Y-%m')
ORDER BY month ASC;


SELECT 
    r.reader_id,
    r.full_name,
    r.email,
    r.phone,
    r.address,
    r.max_quota,
    r.created_at,
    COUNT(DISTINCT br.borrow_id) AS total_borrows,
    COUNT(CASE WHEN br.status = 'BORROWING' THEN 1 END) AS current_borrows,
    COUNT(CASE WHEN br.status = 'RETURNED' THEN 1 END) AS returned_borrows,
    COUNT(CASE WHEN br.status = 'OVERDUE' THEN 1 END) AS overdue_borrows
FROM Readers r
LEFT JOIN BorrowRecords br ON r.reader_id = br.reader_id
WHERE r.full_name LIKE '%từ khóa%'  -- Thay '%từ khóa%' bằng ? trong code
   OR r.email LIKE '%từ khóa%'
   OR r.phone LIKE '%từ khóa%'
GROUP BY r.reader_id, r.full_name, r.email, r.phone, r.address, r.max_quota, r.created_at
ORDER BY r.created_at DESC
LIMIT 10 OFFSET 0;  -- Thay LIMIT và OFFSET bằng ? trong code

SELECT COUNT(*) AS total
FROM Readers
WHERE full_name LIKE '%từ khóa%'
   OR email LIKE '%từ khóa%'
   OR phone LIKE '%từ khóa%';

SELECT 
    r.reader_id,
    r.full_name,
    r.email,
    r.phone,
    r.address,
    r.max_quota,
    r.created_at,
    COUNT(DISTINCT br.borrow_id) AS total_borrows,
    COUNT(CASE WHEN br.status = 'BORROWING' THEN 1 END) AS current_borrows,
    COUNT(CASE WHEN br.status = 'RETURNED' THEN 1 END) AS returned_borrows,
    COUNT(CASE WHEN br.status = 'OVERDUE' THEN 1 END) AS overdue_borrows
FROM Readers r
LEFT JOIN BorrowRecords br ON r.reader_id = br.reader_id
WHERE r.reader_id = 1  -- Thay bằng ? trong code
GROUP BY r.reader_id, r.full_name, r.email, r.phone, r.address, r.max_quota, r.created_at;

SELECT 
    br.borrow_id,
    br.borrow_date,
    br.due_date,
    br.return_date,
    br.status,
    DATEDIFF(CURDATE(), br.due_date) AS days_overdue,
    b.book_id,
    b.title AS book_title,
    b.author AS book_author,
    c.name AS category_name
FROM BorrowRecords br
INNER JOIN Books b ON br.book_id = b.book_id
LEFT JOIN Categories c ON b.category_id = c.category_id
WHERE br.reader_id = 1  -- Thay bằng ? trong code
ORDER BY br.borrow_date DESC
LIMIT 50;  -- Có thể thêm phân trang


SELECT 
    br.borrow_id,
    br.borrow_date,
    br.due_date,
    DATEDIFF(br.due_date, CURDATE()) AS days_remaining,  -- Số ngày còn lại
    CASE 
        WHEN br.due_date < CURDATE() THEN DATEDIFF(CURDATE(), br.due_date)
        ELSE 0
    END AS days_overdue,
    br.status,
    r.reader_id,
    r.full_name AS reader_name,
    r.email AS reader_email,
    r.phone AS reader_phone,
    r.address AS reader_address,
    b.book_id,
    b.title AS book_title,
    b.author AS book_author,
    c.name AS category_name,
    b.image_url AS book_image
FROM BorrowRecords br
INNER JOIN Readers r ON br.reader_id = r.reader_id
INNER JOIN Books b ON br.book_id = b.book_id
LEFT JOIN Categories c ON b.category_id = c.category_id
WHERE br.status = 'BORROWING'
  AND br.return_date IS NULL
  AND (
    r.full_name LIKE '%từ khóa%'  -- Thay bằng ? trong code
    OR b.title LIKE '%từ khóa%'
    OR b.author LIKE '%từ khóa%'
  )
ORDER BY br.borrow_date DESC
LIMIT 10 OFFSET 0;  -- Thay bằng ? trong code

SELECT COUNT(*) AS total
FROM BorrowRecords br
INNER JOIN Readers r ON br.reader_id = r.reader_id
INNER JOIN Books b ON br.book_id = b.book_id
WHERE br.status = 'BORROWING'
  AND br.return_date IS NULL
  AND (
    r.full_name LIKE '%từ khóa%'
    OR b.title LIKE '%từ khóa%'
    OR b.author LIKE '%từ khóa%'
  );

SELECT 
    br.borrow_id,
    br.borrow_date,
    br.due_date,
    DATEDIFF(br.due_date, CURDATE()) AS days_remaining,
    r.reader_id,
    r.full_name AS reader_name,
    r.email AS reader_email,
    r.phone AS reader_phone,
    b.book_id,
    b.title AS book_title,
    b.author AS book_author
FROM BorrowRecords br
INNER JOIN Readers r ON br.reader_id = r.reader_id
INNER JOIN Books b ON br.book_id = b.book_id
WHERE br.status = 'BORROWING'
  AND br.return_date IS NULL
  AND br.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)
ORDER BY br.due_date ASC;


SELECT 
    br.borrow_id,
    br.borrow_date,
    br.due_date,
    DATEDIFF(CURDATE(), br.due_date) AS days_overdue,
    br.status,
    r.reader_id,
    r.full_name AS reader_name,
    r.email AS reader_email,
    r.phone AS reader_phone,
    r.address AS reader_address,
    b.book_id,
    b.title AS book_title,
    b.author AS book_author,
    c.name AS category_name,
    b.image_url AS book_image
FROM BorrowRecords br
INNER JOIN Readers r ON br.reader_id = r.reader_id
INNER JOIN Books b ON br.book_id = b.book_id
LEFT JOIN Categories c ON b.category_id = c.category_id
WHERE (br.status = 'OVERDUE' 
   OR (br.status = 'BORROWING' AND br.due_date < CURDATE() AND br.return_date IS NULL))
  AND (
    r.full_name LIKE '%từ khóa%'  -- Thay bằng ? trong code
    OR b.title LIKE '%từ khóa%'
    OR b.author LIKE '%từ khóa%'
  )
ORDER BY days_overdue DESC, br.due_date ASC
LIMIT 10 OFFSET 0;  -- Thay bằng ? trong code

SELECT COUNT(*) AS total
FROM BorrowRecords br
INNER JOIN Readers r ON br.reader_id = r.reader_id
INNER JOIN Books b ON br.book_id = b.book_id
WHERE (br.status = 'OVERDUE' 
   OR (br.status = 'BORROWING' AND br.due_date < CURDATE() AND br.return_date IS NULL))
  AND (
    r.full_name LIKE '%từ khóa%'
    OR b.title LIKE '%từ khóa%'
    OR b.author LIKE '%từ khóa%'
  );

SELECT 
    CASE 
        WHEN DATEDIFF(CURDATE(), br.due_date) <= 7 THEN '1-7 ngày'
        WHEN DATEDIFF(CURDATE(), br.due_date) <= 14 THEN '8-14 ngày'
        WHEN DATEDIFF(CURDATE(), br.due_date) <= 30 THEN '15-30 ngày'
        ELSE 'Trên 30 ngày'
    END AS overdue_range,
    COUNT(*) AS count
FROM BorrowRecords br
WHERE (br.status = 'OVERDUE' 
   OR (br.status = 'BORROWING' AND br.due_date < CURDATE() AND br.return_date IS NULL))
GROUP BY overdue_range
ORDER BY 
    CASE overdue_range
        WHEN '1-7 ngày' THEN 1
        WHEN '8-14 ngày' THEN 2
        WHEN '15-30 ngày' THEN 3
        ELSE 4
    END;

SELECT 
    r.reader_id,
    r.full_name,
    r.email,
    r.phone,
    COUNT(br.borrow_id) AS overdue_count,
    MAX(DATEDIFF(CURDATE(), br.due_date)) AS max_days_overdue
FROM Readers r
INNER JOIN BorrowRecords br ON r.reader_id = br.reader_id
WHERE (br.status = 'OVERDUE' 
   OR (br.status = 'BORROWING' AND br.due_date < CURDATE() AND br.return_date IS NULL))
GROUP BY r.reader_id, r.full_name, r.email, r.phone
ORDER BY overdue_count DESC, max_days_overdue DESC
LIMIT 10;
