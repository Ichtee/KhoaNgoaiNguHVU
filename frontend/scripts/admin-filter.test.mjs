// Run: npm run test:admin
import assert from 'assert';
import { filterAdminPosts } from '../src/site/admin/filter.js';

const cats = [
  { slug: 'dao-tao', parent: '' },
  { slug: 'thong-bao-dao-tao', parent: 'dao-tao' },
  { slug: 'nckh', parent: '' }
];
const now = Date.parse('2026-11-19T12:00:00+07:00');
const P = [
  { id: 1, title: 'Hội thảo khoa học', category: 'nckh', createdAt: '2026-11-18T03:00:00Z', isFeatured: true, pinned: false, coverImage: 'a.jpg' },
  { id: 2, title: 'Lịch thi học kỳ', category: 'thong-bao-dao-tao', createdAt: '2026-10-01T03:00:00Z', isFeatured: false, pinned: true, coverImage: '' },
  { id: 3, title: 'Tuyển sinh', category: 'dao-tao', createdAt: '2025-06-01T03:00:00Z', isFeatured: false, pinned: false, coverImage: 'b.jpg' }
];
const base = { q: '', cat: '', time: '', status: '', sort: 'moi' };
const ids = (f) => filterAdminPosts(P, cats, { ...base, ...f }, now).map((p) => p.id).join();

assert.equal(ids({}), '1,2,3');
assert.equal(ids({ q: 'hoi thao' }), '1'); // accents ignored
assert.equal(ids({ q: 'LICH THI' }), '2');
assert.equal(ids({ cat: 'dao-tao' }), '2,3'); // a big section includes its sub-sections
assert.equal(ids({ cat: 'thong-bao-dao-tao' }), '2');
assert.equal(ids({ time: '7' }), '1');
assert.equal(ids({ time: '90' }), '1,2');
assert.equal(ids({ time: 'nam' }), '1,2');
assert.equal(ids({ status: 'ghim' }), '2');
assert.equal(ids({ status: 'khong-anh' }), '2');
assert.equal(ids({ sort: 'cu' }), '3,2,1');
assert.equal(ids({ cat: 'dao-tao', status: 'ghim', time: '90' }), '2');
// pinned posts arrive first from the server; the admin list is by date anyway
assert.equal(filterAdminPosts([P[1], P[0], P[2]], cats, base, now).map((p) => p.id).join(), '1,2,3');
console.log('admin filter checks pass');
