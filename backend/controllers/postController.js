const { getDBMode } = require('../config/db');
const { memoryStore, generateId } = require('../utils/memoryStore');
const Post = require('../models/Post');
const Category = require('../models/Category');

const createSlug = (title) => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .replace(/(\s+)/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') + '-' + Date.now();
};

// @desc    Get all posts with filters & search
// @route   GET /api/posts
const getPosts = async (req, res) => {
  try {
    const { search, category, tag, isFeatured } = req.query;
    const isMemDB = getDBMode();

    if (isMemDB) {
      let filtered = [...memoryStore.posts];

      if (category && category !== 'all') {
        filtered = filtered.filter(p => p.category === category || p.category?.slug === category || p.category?._id === category);
      }

      if (tag) {
        filtered = filtered.filter(p => p.tags && p.tags.includes(tag));
      }

      if (isFeatured === 'true') {
        filtered = filtered.filter(p => p.isFeatured === true);
      }

      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(p => 
          p.title.toLowerCase().includes(q) || 
          p.excerpt.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q)
        );
      }

      // Populate author & category
      const populated = filtered.map(p => {
        const authorObj = memoryStore.users.find(u => u._id === (typeof p.author === 'object' ? p.author._id : p.author)) || p.author;
        const categoryObj = memoryStore.categories.find(c => c._id === (typeof p.category === 'object' ? p.category._id : p.category)) || p.category;
        return {
          ...p,
          author: typeof authorObj === 'object' ? authorObj : { _id: authorObj, name: 'Tác giả' },
          category: typeof categoryObj === 'object' ? categoryObj : { _id: categoryObj, name: 'Công nghệ', color: '#6366f1' }
        };
      });

      // Sort by latest
      populated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return res.json(populated);
    } else {
      let query = { status: 'published' };

      if (category && category !== 'all') {
        // Find category ID by slug or ID
        const catObj = await Category.findOne({ $or: [{ slug: category }, { _id: category }] });
        if (catObj) {
          query.category = catObj._id;
        }
      }

      if (tag) {
        query.tags = tag;
      }

      if (isFeatured === 'true') {
        query.isFeatured = true;
      }

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { excerpt: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } }
        ];
      }

      const posts = await Post.find(query)
        .populate('author', 'name avatar bio role')
        .populate('category', 'name slug color icon')
        .sort({ createdAt: -1 });

      return res.json(posts);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single post by slug or ID
// @route   GET /api/posts/:identifier
const getPostByIdentifier = async (req, res) => {
  try {
    const { identifier } = req.params;
    const isMemDB = getDBMode();

    if (isMemDB) {
      let post = memoryStore.posts.find(p => p.slug === identifier || p._id === identifier);
      if (!post) {
        return res.status(404).json({ message: 'Không tìm thấy bài viết' });
      }

      // Increment views
      post.views = (post.views || 0) + 1;

      const authorObj = memoryStore.users.find(u => u._id === (typeof post.author === 'object' ? post.author._id : post.author)) || post.author;
      const categoryObj = memoryStore.categories.find(c => c._id === (typeof post.category === 'object' ? post.category._id : post.category)) || post.category;

      return res.json({
        ...post,
        author: authorObj,
        category: categoryObj
      });
    } else {
      let post = await Post.findOne({ $or: [{ slug: identifier }, { _id: identifier.match(/^[0-9a-fA-F]{24}$/) ? identifier : null }] })
        .populate('author', 'name avatar bio role')
        .populate('category', 'name slug color icon');

      if (!post) {
        return res.status(404).json({ message: 'Không tìm thấy bài viết' });
      }

      post.views += 1;
      await post.save();

      return res.json(post);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new post
// @route   POST /api/posts
const createPost = async (req, res) => {
  try {
    const { title, excerpt, content, coverImage, categoryId, tags, readTime, isFeatured } = req.body;

    if (!title || !excerpt || !content || !categoryId) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ tiêu đề, tóm tắt, nội dung và danh mục' });
    }

    const slug = createSlug(title);
    const defaultCover = coverImage || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80';
    const tagArray = Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : ['Tech']);
    const isMemDB = getDBMode();

    if (isMemDB) {
      const categoryObj = memoryStore.categories.find(c => c._id === categoryId) || memoryStore.categories[0];
      const newPost = {
        _id: generateId(),
        title,
        slug,
        excerpt,
        content,
        coverImage: defaultCover,
        category: categoryObj,
        author: req.user,
        tags: tagArray,
        readTime: Number(readTime) || 5,
        views: 0,
        likes: 0,
        isFeatured: Boolean(isFeatured),
        status: 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      memoryStore.posts.unshift(newPost);
      return res.status(201).json(newPost);
    } else {
      const newPost = await Post.create({
        title,
        slug,
        excerpt,
        content,
        coverImage: defaultCover,
        category: categoryId,
        author: req.user._id,
        tags: tagArray,
        readTime: Number(readTime) || 5,
        isFeatured: Boolean(isFeatured),
        status: 'published'
      });

      const populated = await Post.findById(newPost._id)
        .populate('author', 'name avatar bio role')
        .populate('category', 'name slug color icon');

      return res.status(201).json(populated);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Like a post
// @route   PUT /api/posts/:id/like
const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const isMemDB = getDBMode();

    if (isMemDB) {
      const post = memoryStore.posts.find(p => p._id === id || p.slug === id);
      if (!post) {
        return res.status(404).json({ message: 'Bài viết không tồn tại' });
      }
      post.likes = (post.likes || 0) + 1;
      return res.json({ likes: post.likes });
    } else {
      const post = await Post.findById(id);
      if (!post) {
        return res.status(404).json({ message: 'Bài viết không tồn tại' });
      }
      post.likes += 1;
      await post.save();
      return res.json({ likes: post.likes });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const isMemDB = getDBMode();

    if (isMemDB) {
      const index = memoryStore.posts.findIndex(p => p._id === id);
      if (index !== -1) {
        memoryStore.posts.splice(index, 1);
        return res.json({ message: 'Đã xóa bài viết thành công' });
      }
      return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    } else {
      await Post.findByIdAndDelete(id);
      return res.json({ message: 'Đã xóa bài viết thành công' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPosts, getPostByIdentifier, createPost, likePost, deletePost };
