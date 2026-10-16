const jwt = require('jsonwebtoken');
const { getDBMode } = require('../config/db');
const { memoryStore } = require('../utils/memoryStore');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mern_blog_secret_key_2026');

      if (getDBMode()) {
        const user = memoryStore.users.find(u => u._id === decoded.id);
        if (user) {
          const { password, ...userWithoutPassword } = user;
          req.user = userWithoutPassword;
        }
      } else {
        req.user = await User.findById(decoded.id).select('-password');
      }

      if (!req.user) {
        return res.status(401).json({ message: 'Không tìm thấy người dùng hợp lệ' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
  } else {
    return res.status(401).json({ message: 'Vui lòng cung cấp Authentication Token' });
  }
};

module.exports = { protect };
