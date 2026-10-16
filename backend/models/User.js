const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    bio: { type: String, default: 'Yêu thích công nghệ & chia sẻ kiến thức lập trình.' },
    role: { type: String, enum: ['user', 'author', 'admin'], default: 'author' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
