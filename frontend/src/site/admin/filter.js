// The admin's post list filters. f = { q, cat, time, status, sort }, all strings from the address bar.
const DAY = 864e5;
const fold = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
const year = (t) => new Date(t).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).slice(0, 4);

const STATUS = {
  'noi-bat': (p) => p.isFeatured,
  ghim: (p) => p.pinned,
  'khong-anh': (p) => !p.coverImage
};

export function filterAdminPosts(posts, cats, f, now = Date.now()) {
  const words = fold(f.q).split(/\s+/).filter(Boolean);
  // a big section also covers its sub-sections
  const inCat = f.cat ? new Set([f.cat, ...cats.filter((c) => c.parent === f.cat).map((c) => c.slug)]) : null;
  const out = posts.filter((p) => {
    if (inCat && !inCat.has(p.category)) return false;
    if (/^\d+$/.test(f.time) && now - new Date(p.createdAt) > Number(f.time) * DAY) return false;
    if (f.time === 'nam' && year(p.createdAt) !== year(now)) return false;
    if (STATUS[f.status] && !STATUS[f.status](p)) return false;
    const title = fold(p.title);
    return words.every((w) => title.includes(w));
  });
  // by date only (the server puts pinned posts first, which is right for visitors, not for finding a post)
  const dir = f.sort === 'cu' ? 1 : -1;
  return out.sort((a, b) => dir * (new Date(a.createdAt) - new Date(b.createdAt)));
}
