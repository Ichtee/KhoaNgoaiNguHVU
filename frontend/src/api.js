const TOKEN = 'hvu_admin_token';
// '' in development (vite forwards /api to the backend); in production the backend's address, set when the site is built
const API = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export const getToken = () => localStorage.getItem(TOKEN);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN, t) : localStorage.removeItem(TOKEN));

async function call(path, { method = 'GET', body, raw, type } = {}) {
  const headers = {};
  if (getToken()) headers.Authorization = `Bearer ${getToken()}`;
  if (body && !raw) headers['Content-Type'] = 'application/json';
  if (raw) headers['Content-Type'] = type;
  const res = await fetch(`${API}/api${path}`, { method, headers, body: raw || (body && JSON.stringify(body)) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Có lỗi xảy ra');
  return data;
}

const qs = (o) => new URLSearchParams(Object.entries(o).filter(([, v]) => v)).toString();

// create when there is no id/slug yet, update otherwise
const save = (base, key, item) =>
  item[key] ? call(`${base}/${item[key]}`, { method: 'PUT', body: item }) : call(base, { method: 'POST', body: item });

export const api = {
  login: (username, password) => call('/login', { method: 'POST', body: { username, password } }),
  settings: () => call('/settings'),
  saveSettings: (settings) => call('/settings', { method: 'PUT', body: settings }),
  categories: () => call('/categories'),
  addCategory: (name, parent) => call('/categories', { method: 'POST', body: { name, parent } }),
  renameCategory: (slug, name) => call(`/categories/${slug}`, { method: 'PUT', body: { name } }),
  deleteCategory: (slug) => call(`/categories/${slug}`, { method: 'DELETE' }),
  posts: (params = {}) => call(`/posts?${qs(params)}`),
  post: (slug) => call(`/posts/${slug}`),
  savePost: (post) => save('/posts', 'id', post),
  deletePost: (id) => call(`/posts/${id}`, { method: 'DELETE' }),
  pages: () => call('/pages'),
  page: (slug) => call(`/pages/${slug}`),
  savePage: (page) => save('/pages', 'slug', page),
  deletePage: (slug) => call(`/pages/${slug}`, { method: 'DELETE' }),
  upload: (file) => call('/upload', { method: 'POST', raw: file, type: file.type })
};

export const fmtDate = (iso) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
