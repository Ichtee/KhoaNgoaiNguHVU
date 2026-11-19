const TOKEN = 'hvu_admin_token';
// '' in development (vite forwards /api to the backend); in production the backend's address, set when the site is built
const API = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export const getToken = () => localStorage.getItem(TOKEN);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN, t) : localStorage.removeItem(TOKEN));

// The free server sleeps when idle and restarts on each deploy; for a minute it refuses connections.
// Reads wait it out (about 15s in all); writes are never repeated, since the first one may have arrived.
export const RETRY_DELAYS = [1000, 2000, 4000, 8000];
const OFFLINE = 'Không kết nối được máy chủ. Máy chủ có thể đang khởi động, vui lòng tải lại trang sau ít phút.';

async function call(path, { method = 'GET', body, raw, type } = {}) {
  const headers = {};
  if (getToken()) headers.Authorization = `Bearer ${getToken()}`;
  if (body && !raw) headers['Content-Type'] = 'application/json';
  if (raw) headers['Content-Type'] = type;
  let res;
  for (let attempt = 0; !res; attempt++) {
    try {
      res = await fetch(`${API}/api${path}`, { method, headers, body: raw || (body && JSON.stringify(body)) });
    } catch {
      // fetch only throws when no answer came back at all (offline, server down)
      if (method !== 'GET' || attempt >= RETRY_DELAYS.length) throw new Error(OFFLINE);
      await new Promise((ok) => setTimeout(ok, RETRY_DELAYS[attempt]));
    }
  }
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
  logout: () => call('/logout', { method: 'POST' }),
  session: () => call('/session'),
  settings: () => call('/settings'),
  saveSettings: (settings) => call('/settings', { method: 'PUT', body: settings }),
  categories: () => call('/categories'),
  addCategory: (name, parent) => call('/categories', { method: 'POST', body: { name, parent } }),
  updateCategory: (slug, { name, description }) => call(`/categories/${slug}`, { method: 'PUT', body: { name, description } }),
  reorderCategories: (slugs) => call('/categories/order', { method: 'PUT', body: { slugs } }),
  reorderPages: (slugs) => call('/pages/order', { method: 'PUT', body: { slugs } }),
  deleteCategory: (slug) => call(`/categories/${slug}`, { method: 'DELETE' }),
  posts: (params = {}) => call(`/posts?${qs(params)}`),
  post: (slug) => call(`/posts/${slug}`),
  savePost: (post) => save('/posts', 'id', post),
  deletePost: (id) => call(`/posts/${id}`, { method: 'DELETE' }),
  pages: () => call('/pages'),
  page: (slug) => call(`/pages/${slug}`),
  savePage: (page) => save('/pages', 'slug', page),
  deletePage: (slug) => call(`/pages/${slug}`, { method: 'DELETE' }),
  upload: (file) => call(`/upload?${qs({ name: file.name })}`, { method: 'POST', raw: file, type: file.type })
};

export const fmtDate = (iso) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
