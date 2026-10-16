const { getDBMode } = require('../config/db');
const { memoryStore, generateId } = require('../utils/memoryStore');
const Category = require('../models/Category');

// @desc    Get all categories
// @route   GET /api/categories
const getCategories = async (req, res) => {
  try {
    const isMemDB = getDBMode();
    if (isMemDB) {
      return res.json(memoryStore.categories);
    } else {
      const categories = await Category.find({}).sort({ name: 1 });
      return res.json(categories);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a category
// @route   POST /api/categories
const createCategory = async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Tên danh mục là bắt buộc' });
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const isMemDB = getDBMode();

    if (isMemDB) {
      const newCategory = {
        _id: generateId(),
        name,
        slug,
        description: description || '',
        color: color || '#6366f1',
        icon: icon || 'Folder',
        createdAt: new Date().toISOString()
      };
      memoryStore.categories.push(newCategory);
      return res.status(201).json(newCategory);
    } else {
      const category = await Category.create({
        name,
        slug,
        description,
        color: color || '#6366f1',
        icon: icon || 'Folder'
      });
      return res.status(201).json(category);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCategories, createCategory };
