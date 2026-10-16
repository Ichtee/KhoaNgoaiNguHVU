const crypto = require('crypto');
const mongoose = require('mongoose');
const { seed, legacy, archiveLegacy, DEFAULT_SETTINGS } = require('./store');

const { Schema } = mongoose;
const unique = { type: String, required: true, unique: true };
const File = new Schema({ name: String, url: String }, { _id: false });

// Posts keep their own string `id` (older installs already handed those out); slugs and ids are unique.
const Category = mongoose.model('Category', new Schema({
  slug: unique,
  name: { type: String, required: true },
  parent: { type: String, default: '' }, // '' = top level, else the slug of a top-level category
  order: { type: Number, default: 0 }
}));

const Page = mongoose.model('Page', new Schema({
  slug: unique,
  title: { type: String, required: true },
  content: { type: String, required: true },
  group: { type: String, default: '' }, // top-level category whose menu lists this page
  files: [File],
  order: { type: Number, default: 0 }
}));

const Post = mongoose.model('Post', new Schema({
  id: unique,
  slug: unique,
  title: { type: String, required: true },
  excerpt: { type: String, default: '' },
  content: { type: String, required: true },
  coverImage: { type: String, default: '' },
  category: { type: String, required: true, index: true },
  isFeatured: { type: Boolean, default: false },
  pinned: { type: Boolean, default: false },
  pinnedUntil: { type: String, default: '' }, // YYYY-MM-DD or ''
  files: [File],
  author: { type: String, default: '' }, // free text: several people share one admin account
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: Date // compared on save so one admin cannot silently overwrite another's edit
}));

// one document (key 'site'): the name, contact details and links shown across the site
const Setting = mongoose.model('Setting', new Schema({
  key: unique,
  name: String, university: String, tagline: String,
  address: String, phone: String, email: String, facebook: String, website: String
}));

// Login sessions. The browser keeps a random token; only its hash is stored, so a copy of the database cannot be used to log in.
const sessionSchema = new Schema({ tokenHash: unique, expiresAt: { type: Date, required: true } });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // MongoDB deletes expired sessions by itself
const Session = mongoose.model('Session', sessionSchema);

// The admin account lives in the database. There is no web page or API to create or change it: only someone who can reach
// the database can (npm run set-admin). Only a salted scrypt hash of the password is stored, never the password.
const Admin = mongoose.model('Admin', new Schema({ username: unique, salt: { type: String, required: true }, hash: { type: String, required: true } }));

const scrypt = (password, salt) => new Promise((resolve, reject) => {
  crypto.scrypt(String(password), salt, 64, (err, key) => (err ? reject(err) : resolve(key)));
});

async function newCredential(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return { salt, hash: (await scrypt(password, salt)).toString('hex') };
}

// Always does the same work, found or not, so response time does not reveal whether a username exists.
const NOBODY = { salt: '00'.repeat(16), hash: '00'.repeat(64) };
async function checkPassword(password, account) {
  const { salt, hash } = account || NOBODY;
  const ok = crypto.timingSafeEqual(await scrypt(password, salt), Buffer.from(hash, 'hex'));
  return Boolean(account) && ok;
}

// insert-if-missing, so a seed that was interrupted can simply run again
const insertMissing = (Model, field, docs) =>
  Model.bulkWrite(docs.map((d) => ({ updateOne: { filter: { [field]: d[field] }, update: { $setOnInsert: d }, upsert: true } })));

// Runs once: the 'site' settings document marks a database as already filled.
async function seedOnce() {
  if (await Setting.exists({ key: 'site' })) return;
  const old = legacy();
  const src = old || seed();
  await insertMissing(Category, 'slug', src.categories.map((c, order) => ({ slug: c.slug, name: c.name, parent: c.parent || '', order })));
  await insertMissing(Page, 'slug', Object.entries(src.pages).map(([slug, p], order) => ({ slug, ...p, order })));
  await insertMissing(Post, 'id', src.posts.map((p) => ({ ...p, createdAt: new Date(p.createdAt) })));
  // upsert, not create: two instances starting together on an empty database must not crash each other
  await Setting.updateOne({ key: 'site' }, { $setOnInsert: DEFAULT_SETTINGS }, { upsert: true });
  if (old) archiveLegacy();
  console.log(old ? 'Đã nhập dữ liệu từ data/db.json vào MongoDB' : 'Đã tạo dữ liệu ban đầu trong MongoDB');
}

async function connect(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  await Promise.all([Category, Page, Post, Setting, Session, Admin].map((m) => m.init())); // unique indexes exist before the first request
  await seedOnce();
  // posts made before the overwrite guard existed: their creation time counts as the last save, so even their first edit is protected
  await Post.updateMany({ updatedAt: null }, [{ $set: { updatedAt: '$createdAt' } }]);
}

module.exports = { connect, newCredential, checkPassword, Category, Page, Post, Setting, Session, Admin };
