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

// A fingerprint of the admin login the sessions were created under. Kept apart from Setting, which the public API returns.
const Auth = mongoose.model('Auth', new Schema({ key: unique, salt: String, check: String }));

// Everyone is signed out when ADMIN_USER or ADMIN_PASSWORD has changed since the last start, so changing the password locks out
// anyone who still has an old session (a person who left the team, a lost laptop).
// ponytail: noticed at startup only; Render restarts the service after an environment change, which is when this runs.
async function syncCredentials(user, password) {
  const doc = (await Auth.findOne({ key: 'admin' }).lean()) || { salt: crypto.randomBytes(16).toString('hex') };
  const check = crypto.scryptSync(`${user}\n${password}`, doc.salt, 32).toString('hex'); // slow on purpose: stored, so it must resist guessing
  if (doc.check === check) return;
  await Session.deleteMany({});
  await Auth.updateOne({ key: 'admin' }, { salt: doc.salt, check }, { upsert: true });
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
  await Promise.all([Category, Page, Post, Setting, Session, Auth].map((m) => m.init())); // unique indexes exist before the first request
  await seedOnce();
  // posts made before the overwrite guard existed: their creation time counts as the last save, so even their first edit is protected
  await Post.updateMany({ updatedAt: null }, [{ $set: { updatedAt: '$createdAt' } }]);
}

module.exports = { connect, syncCredentials, Category, Page, Post, Setting, Session };
