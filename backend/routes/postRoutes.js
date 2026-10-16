const express = require('express');
const router = express.Router();
const { getPosts, getPostByIdentifier, createPost, likePost, deletePost } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getPosts);
router.get('/:identifier', getPostByIdentifier);
router.post('/', protect, createPost);
router.put('/:id/like', likePost);
router.delete('/:id', protect, deletePost);

module.exports = router;
