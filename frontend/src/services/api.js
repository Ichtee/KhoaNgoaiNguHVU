const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('blog_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Auth API
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Đăng nhập thất bại');
    return data;
  },

  async register(userData) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Đăng ký thất bại');
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Phiên đăng nhập hết hạn');
    return data;
  },

  // Posts API
  async getPosts({ search = '', category = 'all', tag = '', isFeatured = false } = {}) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category && category !== 'all') params.append('category', category);
    if (tag) params.append('tag', tag);
    if (isFeatured) params.append('isFeatured', 'true');

    const res = await fetch(`${API_BASE}/posts?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Không thể tải danh sách bài viết');
    return data;
  },

  async getPostBySlug(slug) {
    const res = await fetch(`${API_BASE}/posts/${slug}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Không tìm thấy bài viết');
    return data;
  },

  async createPost(postData) {
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(postData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Tạo bài viết thất bại');
    return data;
  },

  async likePost(postId) {
    const res = await fetch(`${API_BASE}/posts/${postId}/like`, {
      method: 'PUT',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi khi thả thích');
    return data;
  },

  async deletePost(postId) {
    const res = await fetch(`${API_BASE}/posts/${postId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Xóa bài viết thất bại');
    return data;
  },

  // Categories API
  async getCategories() {
    const res = await fetch(`${API_BASE}/categories`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Không thể tải danh mục');
    return data;
  },

  // Comments API
  async getComments(postId) {
    const res = await fetch(`${API_BASE}/comments/${postId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Không thể tải bình luận');
    return data;
  },

  async addComment(commentData) {
    const res = await fetch(`${API_BASE}/comments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(commentData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Không thể gửi bình luận');
    return data;
  },

  // Seed API
  async seedData() {
    const res = await fetch(`${API_BASE}/seed`, { method: 'POST' });
    return await res.json();
  }
};
