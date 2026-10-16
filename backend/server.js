const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { connect, Category, Page, Post, Setting } = require('./db');

const { ADMIN_USER = 'admin', ADMIN_PASSWORD, JWT_SECRET, PORT = 5000 } = process.env;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI; // both names are common
if (!ADMIN_PASSWORD || !JWT_SECRET) {
  console.error('Thiếu ADMIN_PASSWORD hoặc JWT_SECRET trong backend/.env');
  process.exit(1);
}
if (!MONGODB_URI) {
  console.error('Thiếu MONGODB_URI (hoặc MONGO_URI) trong backend/.env: chuỗi kết nối MongoDB, dạng mongodb+srv://...');
  process.exit(1);
}

const UPLOADS = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOADS, { recursive: true });

const app = express();
// behind Render's load balancer req.ip is the visitor only if we trust that one hop (TRUST_PROXY=0 when there is no proxy)
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));
// CORS_ORIGIN = the website address(es), comma separated. Unset (local development) allows any origin.
// (a trailing "/" is dropped: browsers send the origin without one, so https://site/ would never match)
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim().replace(/\/+$/, '')) : true }));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(UPLOADS, { setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff') }));

// lets route handlers be async without a try/catch each; failures reach the error handler at the bottom
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const HIDE = '-_id -__v';

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
const same = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));

const admin = (req, res, next) => {
  try {
    jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Vui lòng đăng nhập quản trị' });
  }
};

const slugify = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'muc';

const uniqueSlug = async (title, taken) => {
  const base = slugify(title);
  let slug = base;
  for (let n = 2; await taken(slug); n++) slug = `${base}-${n}`;
  return slug;
};

const nextOrder = async (Model) => ((await Model.findOne().sort('-order').select('order').lean())?.order ?? -1) + 1;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// pinned until the end of the chosen day, Vietnam time
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
const isPinned = (p) => Boolean(p.pinned) && (!p.pinnedUntil || p.pinnedUntil >= today());
const withPin = (p) => ({ ...p, pinnedNow: isPinned(p) });

// only files we stored ourselves, so a crafted "url" can never become a javascript: link
const cleanFiles = (files) =>
  (Array.isArray(files) ? files : [])
    .filter((f) => f && typeof f.url === 'string' && /^\/uploads\/[\w.-]+$/.test(f.url))
    .map((f) => ({ name: String(f.name || 'Tệp đính kèm').slice(0, 200), url: f.url }));

const pickPost = (b) => ({
  title: String(b.title || '').trim(),
  excerpt: String(b.excerpt || '').trim(),
  content: String(b.content || '').trim(),
  coverImage: String(b.coverImage || ''),
  category: String(b.category || ''),
  isFeatured: Boolean(b.isFeatured),
  pinned: Boolean(b.pinned),
  pinnedUntil: /^\d{4}-\d{2}-\d{2}$/.test(b.pinnedUntil) ? b.pinnedUntil : '',
  files: cleanFiles(b.files),
  author: String(b.author || '').trim().slice(0, 80)
});

const pickPage = async (b) => ({
  title: String(b.title || '').trim(),
  content: String(b.content || '').trim(),
  group: (await Category.exists({ slug: b.group, parent: '' })) ? b.group : '',
  files: cleanFiles(b.files)
});

const category = (c) => ({ slug: c.slug, name: c.name, parent: c.parent });
const plainPost = (doc) => withPin(doc.toObject({ versionKey: false, transform: (d, r) => { delete r._id; return r; } }));

// ---- auth
// Slows password guessing: after MAX_FAILS wrong tries from one address, that address waits out the window.
// ponytail: counted per server process and lost on restart; the generous limit is because a whole school can share one public IP. Upgrade to a shared store (Redis) if the API ever runs on several instances.
const MAX_FAILS = 10;
const WINDOW_MS = 15 * 60 * 1000;
const fails = new Map(); // ip -> { count, resetAt }
setInterval(() => { for (const [ip, f] of fails) if (f.resetAt <= Date.now()) fails.delete(ip); }, WINDOW_MS).unref();

app.post('/api/login', (req, res) => {
  const now = Date.now();
  const rec = fails.get(req.ip);
  const active = rec && rec.resetAt > now ? rec : null;
  if (active && active.count >= MAX_FAILS) {
    const minutes = Math.ceil((active.resetAt - now) / 60000);
    return res.status(429).json({ message: `Nhập sai quá nhiều lần. Hãy thử lại sau ${minutes} phút.` });
  }
  const { username, password } = req.body;
  if (same(username, ADMIN_USER) && same(password, ADMIN_PASSWORD)) {
    fails.delete(req.ip);
    return res.json({ token: jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '7d' }) });
  }
  fails.set(req.ip, { count: (active?.count ?? 0) + 1, resetAt: active?.resetAt ?? now + WINDOW_MS });
  res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu' });
});

// ---- site settings: name, contact details and links shown on every page
const SETTING_FIELDS = ['name', 'university', 'tagline', 'address', 'phone', 'email', 'facebook', 'website'];
const siteSettings = () => Setting.findOne({ key: 'site' }).select(`${HIDE} -key`).lean();

app.get('/api/settings', wrap(async (req, res) => res.json((await siteSettings()) || {})));

app.put('/api/settings', admin, wrap(async (req, res) => {
  const data = {};
  for (const f of SETTING_FIELDS) data[f] = String(req.body[f] ?? '').trim().slice(0, 300);
  if (!data.name) return res.status(400).json({ message: 'Cần có tên khoa' });
  for (const f of ['facebook', 'website']) {
    if (data[f] && !/^https?:\/\//i.test(data[f])) return res.status(400).json({ message: 'Liên kết phải bắt đầu bằng http:// hoặc https://' });
  }
  await Setting.updateOne({ key: 'site' }, data, { upsert: true });
  res.json(await siteSettings());
}));

// ---- categories (two levels: a child has `parent` = a top-level slug)
app.get('/api/categories', wrap(async (req, res) => res.json((await Category.find().sort('order')).map(category))));

app.post('/api/categories', admin, wrap(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const parent = req.body.parent || '';
  if (!name) return res.status(400).json({ message: 'Cần có tên chuyên mục' });
  if (parent && !(await Category.exists({ slug: parent, parent: '' }))) {
    return res.status(400).json({ message: 'Chuyên mục cha không hợp lệ' });
  }
  const slug = await uniqueSlug(name, (s) => Category.exists({ slug: s }));
  const created = await Category.create({ slug, name, parent, order: await nextOrder(Category) });
  res.status(201).json(category(created));
}));

app.put('/api/categories/:slug', admin, wrap(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const updated = name && (await Category.findOneAndUpdate({ slug: req.params.slug }, { name }, { new: true }));
  if (!updated) return res.status(400).json({ message: 'Không đổi được tên chuyên mục' });
  res.json(category(updated));
}));

app.delete('/api/categories/:slug', admin, wrap(async (req, res) => {
  const { slug } = req.params;
  if (await Category.exists({ parent: slug })) return res.status(400).json({ message: 'Hãy xóa các chuyên mục con trước' });
  if (await Post.exists({ category: slug })) return res.status(400).json({ message: 'Chuyên mục còn bài viết, hãy chuyển hoặc xóa bài trước' });
  if (await Page.exists({ group: slug })) return res.status(400).json({ message: 'Chuyên mục còn trang con, hãy chuyển hoặc xóa trang trước' });
  await Category.deleteOne({ slug });
  res.json({ ok: true });
}));

// ---- pages (fixed content such as history, majors, admissions; `group` = top-level category whose menu lists it)
app.get('/api/pages', wrap(async (req, res) => res.json(await Page.find().sort('order').select('slug title group -_id').lean())));

app.get('/api/pages/:slug', wrap(async (req, res) => {
  const page = await Page.findOne({ slug: req.params.slug }).select(`${HIDE} -order`).lean();
  page ? res.json(page) : res.status(404).json({ message: 'Không tìm thấy trang' });
}));

app.post('/api/pages', admin, wrap(async (req, res) => {
  const data = await pickPage(req.body);
  if (!data.title || !data.content) return res.status(400).json({ message: 'Cần có tiêu đề và nội dung' });
  const slug = await uniqueSlug(data.title, (s) => Page.exists({ slug: s }));
  await Page.create({ slug, ...data, order: await nextOrder(Page) });
  res.status(201).json({ slug, ...data });
}));

app.put('/api/pages/:slug', admin, wrap(async (req, res) => {
  const data = await pickPage(req.body);
  if (!data.title || !data.content) return res.status(400).json({ message: 'Cần có tiêu đề và nội dung' });
  const updated = await Page.findOneAndUpdate({ slug: req.params.slug }, data, { new: true });
  if (!updated) return res.status(404).json({ message: 'Không tìm thấy trang' });
  res.json({ slug: req.params.slug, ...data });
}));

app.delete('/api/pages/:slug', admin, wrap(async (req, res) => {
  if (req.params.slug === 'gioi-thieu') return res.status(400).json({ message: 'Trang này hiển thị ở trang chủ, chỉ sửa được, không xóa' });
  await Page.deleteOne({ slug: req.params.slug });
  res.json({ ok: true });
}));

// ---- posts
app.get('/api/posts', wrap(async (req, res) => {
  const { category: cat, q, featured, limit } = req.query;
  const filter = {};
  if (cat) {
    // a top-level category also lists the posts of its children
    const kids = await Category.find({ parent: String(cat) }).distinct('slug');
    filter.category = { $in: [String(cat), ...kids] };
  }
  if (featured) filter.isFeatured = true;
  if (q) {
    const rx = new RegExp(escapeRegex(String(q)), 'i');
    filter.$or = [{ title: rx }, { excerpt: rx }, { content: rx }];
  }
  const posts = (await Post.find(filter).select(HIDE).lean())
    .map(withPin)
    .sort((a, b) => b.pinnedNow - a.pinnedNow || b.createdAt - a.createdAt);
  res.json(Number(limit) > 0 ? posts.slice(0, Number(limit)) : posts);
}));

app.get('/api/posts/:slug', wrap(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug }).select(HIDE).lean();
  post ? res.json(withPin(post)) : res.status(404).json({ message: 'Không tìm thấy bài viết' });
}));

const validPost = async (data) => data.title && data.content && (await Category.exists({ slug: data.category }));
const INVALID_POST = { message: 'Cần có tiêu đề, nội dung và danh mục hợp lệ' };

app.post('/api/posts', admin, wrap(async (req, res) => {
  const data = pickPost(req.body);
  if (!(await validPost(data))) return res.status(400).json(INVALID_POST);
  const post = await Post.create({ id: crypto.randomUUID(), slug: `${slugify(data.title)}-${Date.now().toString(36)}`, ...data, updatedAt: new Date() });
  res.status(201).json(plainPost(post));
}));

app.put('/api/posts/:id', admin, wrap(async (req, res) => {
  const data = pickPost(req.body);
  if (!(await validPost(data))) return res.status(400).json(INVALID_POST);
  // only saves if nobody saved this post since the editor opened it (null also matches posts from before this field existed)
  const seen = Date.parse(req.body.updatedAt);
  const post = await Post.findOneAndUpdate(
    { id: req.params.id, updatedAt: Number.isNaN(seen) ? null : new Date(seen) },
    { ...data, updatedAt: new Date() },
    { new: true }
  );
  if (post) return res.json(plainPost(post));
  if (await Post.exists({ id: req.params.id })) {
    return res.status(409).json({ message: 'Bài này vừa được người khác lưu trong lúc bạn đang sửa. Hãy sao chép phần bạn viết, mở lại bài để xem bản mới nhất rồi sửa tiếp.' });
  }
  res.status(404).json({ message: 'Không tìm thấy bài viết' });
}));

app.delete('/api/posts/:id', admin, wrap(async (req, res) => {
  await Post.deleteOne({ id: req.params.id });
  res.json({ ok: true });
}));

// ---- upload: raw body, no extra dependency. Images for covers, documents for attachments.
// ponytail: files stay on this server's disk; on a host with a temporary disk move them to object storage (S3, Cloudinary).
const EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
};
app.post('/api/upload', admin, express.raw({ type: Object.keys(EXT), limit: '15mb' }), (req, res) => {
  const ext = EXT[req.headers['content-type']];
  if (!ext || !Buffer.isBuffer(req.body) || !req.body.length) {
    return res.status(400).json({ message: 'Chỉ nhận ảnh (JPG, PNG, WEBP, GIF) hoặc tệp PDF, Word, Excel, tối đa 15MB' });
  }
  const name = crypto.randomUUID() + ext;
  fs.writeFileSync(path.join(UPLOADS, name), req.body);
  res.json({ url: `/uploads/${name}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status && err.status < 500 ? err.status : 500;
  if (status === 500) console.error(err);
  res.status(status).json({ message: status === 500 ? 'Lỗi máy chủ, vui lòng thử lại' : 'Yêu cầu không hợp lệ' });
});

connect(MONGODB_URI)
  .then(() => app.listen(PORT, () => console.log(`API chạy tại http://localhost:${PORT}`)))
  .catch((err) => {
    console.error(`Không khởi động được: ${err.message}`);
    if (/ServerSelection|bad auth|Authentication|ENOTFOUND|ECONNREFUSED/i.test(`${err.name} ${err.message}`)) {
      console.error('Kiểm tra MONGO_URI (user, mật khẩu, tên cluster), và trên Atlas hãy cho phép địa chỉ IP của máy này (Network Access).');
    }
    process.exit(1);
  });
