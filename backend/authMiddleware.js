const jwt = require('jsonwebtoken');

const MY_SECRET_KEY = 'lap-trinh-web-nang-cao-bi-mat';

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
  }

  jwt.verify(token, MY_SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token không hợp lệ' });
    }

    req.user = user;
    next(); // Cho phép request đi tiếp
  });
}

module.exports = authMiddleware;