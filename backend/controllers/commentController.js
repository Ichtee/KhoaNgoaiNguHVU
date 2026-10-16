const { getDBMode } = require('../config/db');
const { memoryStore, generateId } = require('../utils/memoryStore');
const Comment = require('../models/Comment');

// @desc    Get comments for a post
// @route   GET /api/comments/:postId
const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const isMemDB = getDBMode();

    if (isMemDB) {
      const comments = memoryStore.comments.filter(c => c.post === postId || c.post?._id === postId);
      return res.json(comments);
    } else {
      const comments = await Comment.find({ post: postId }).sort({ createdAt: -1 });
      return res.json(comments);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add comment to a post
// @route   POST /api/comments
const addComment = async (req, res) => {
  try {
    const { postId, content, authorName, authorAvatar } = req.body;
    if (!postId || !content) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ bài viết và nội dung bình luận' });
    }

    const name = req.user ? req.user.name : (authorName || 'Độc giả ẩn danh');
    const avatar = req.user ? req.user.avatar : (authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80');
    const isMemDB = getDBMode();

    if (isMemDB) {
      const newComment = {
        _id: generateId(),
        post: postId,
        authorName: name,
        authorAvatar: avatar,
        content,
        user: req.user ? req.user._id : null,
        createdAt: new Date().toISOString()
      };
      memoryStore.comments.unshift(newComment);
      return res.status(201).json(newComment);
    } else {
      const comment = await Comment.create({
        post: postId,
        authorName: name,
        authorAvatar: avatar,
        content,
        user: req.user ? req.user._id : null
      });
      return res.status(201).json(comment);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCommentsByPost, addComment };
