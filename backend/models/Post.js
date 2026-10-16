const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    coverImage: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [{ type: String }],
    readTime: { type: Number, default: 5 }, // in minutes
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    status: { type: String, enum: ['draft', 'published'], default: 'published' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);
