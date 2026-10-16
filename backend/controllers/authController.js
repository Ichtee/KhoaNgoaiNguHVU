const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getDBMode } = require('../config/db');
const { memoryStore, generateId } = require('../utils/memoryStore');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'mern_blog_secret_key_2026';

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, avatar, bio } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin bắt buộc' });
    }

    const isMemDB = getDBMode();

    if (isMemDB) {
      const existing = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return res.status(400).json({ message: 'Email này đã được sử dụng' });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUser = {
        _id: generateId(),
        name,
        email,
        password: hashedPassword,
        avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bio: bio || 'Tác giả blog MERN Stack',
        role: 'author',
        createdAt: new Date().toISOString()
      };
      memoryStore.users.push(newUser);

      return res.status(201).json({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        bio: newUser.bio,
        role: newUser.role,
        token: generateToken(newUser._id)
      });
    } else {
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: 'Email này đã được sử dụng' });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        avatar,
        bio
      });

      return res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        token: generateToken(user._id)
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const isMemDB = getDBMode();

    if (isMemDB) {
      const user = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user && (await bcrypt.compare(password, user.password))) {
        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          role: user.role,
          token: generateToken(user._id)
        });
      }
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
    } else {
      const user = await User.findOne({ email });
      if (user && (await bcrypt.compare(password, user.password))) {
        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          role: user.role,
          token: generateToken(user._id)
        });
      }
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  res.json(req.user);
};

module.exports = { registerUser, loginUser, getMe };
