import React, { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { PostCard } from './parts';

const PER_PAGE = 9;
const DAY = 864e5;

// accent-insensitive, so "hoi thao" finds "Hội thảo"
const fold = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
// a day in Vietnam time, "2026-11-19", so dates compare as plain strings
const dayOf = (t) => new Date(t).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

// filters live in the address (?muc=a&thoi-gian=30&tu=...&den=...&sap=cu&loc=...), so a filtered list can be shared or bookmarked
export function filterPosts(posts, { cat, time, from, to, sort, kw }, now = Date.now()) {
  const words = fold(kw).split(/\s+/).filter(Boolean);
  const out = posts.filter((p) => {
    if (cat && p.category !== cat) return false;
    const day = dayOf(p.createdAt);
    if (/^\d+$/.test(time) && now - new Date(p.createdAt) > Number(time) * DAY) return false;
    if (time === 'nam' && day.slice(0, 4) !== dayOf(now).slice(0, 4)) return false;
    if (time === 'khoang' && ((ISO_DAY.test(from) && day < from) || (ISO_DAY.test(to) && day > to))) return false;
    const hay = fold(`${p.title} ${p.excerpt}`);
    return words.every((w) => hay.includes(w));
  });
  return sort === 'cu' ? [...out].reverse() : out; // the API already sends newest first, pinned on top
}

export default function PostList() {
  const { slug } = useParams(); // undefined on /tim-kiem
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const { cats, pages } = useOutletContext();
  const [posts, setPosts] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPosts(null);
    setPage(1);
    api.posts({ category: slug, q }).then(setPosts).catch(() => setPosts([]));
  }, [slug, q]);

  const f = {
    cat: params.get('muc') || '',
    time: params.get('thoi-gian') || '',
    from: params.get('tu') || '',
    to: params.get('den') || '',
    sort: params.get('sap') === 'cu' ? 'cu' : 'moi',
    kw: params.get('loc') || ''
  };
  const set = (changes) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
    setPage(1);
  };
  // one category at a time: picking another replaces it, picking the same one again shows all
  const pick = (s) => set({ muc: f.cat === s ? '' : s });
  // leaving the custom range drops its dates, so a hidden range never filters silently
  const setTime = (v) => set({ 'thoi-gian': v, ...(v !== 'khoang' && { tu: '', den: '' }) });
  const clear = () => {
    setParams(q ? { q } : {}, { replace: true });
    setPage(1);
  };
  const filtering = f.cat || f.time || f.kw || f.sort === 'cu';

  const cat = cats.find((c) => c.slug === slug);
  const parent = cat?.parent && cats.find((c) => c.slug === cat.parent);
  const title = slug ? cat?.name || '' : `Kết quả cho “${q}”`;
  // fixed pages filed under this section stay links; categories become filters
  const fixed = slug ? pages.filter((p) => p.group === slug) : [];

  // one chip per category that actually has posts here, in menu order
  const counts = {};
  for (const p of posts || []) counts[p.category] = (counts[p.category] || 0) + 1;
  const chips = cats.filter((c) => counts[c.slug]).map((c) => ({ ...c, n: counts[c.slug] }));

  const shown = posts ? filterPosts(posts, f) : [];
  const pageCount = Math.ceil(shown.length / PER_PAGE);

  return (
    <>
      <div className="pagehead">
        {parent && <p className="crumb"><Link to="/">Trang chủ</Link> › <Link to={`/muc/${parent.slug}`}>{parent.name}</Link></p>}
        <h1>{title}</h1>
        {posts && (posts.length > 0 || fixed.length === 0) && (
          <p role="status">{filtering ? `${shown.length} / ${posts.length} bài viết` : `${posts.length} bài viết`}</p>
        )}
      </div>

      {fixed.length > 0 && (
        <ul className="subnav">
          {fixed.map((p) => <li key={p.slug}><Link to={`/trang/${p.slug}`}>{p.title}</Link></li>)}
        </ul>
      )}

      {posts && posts.length > 0 && (
        <div className="filters">
          {chips.length > 1 && (
            <div className="chips" role="group" aria-label="Lọc theo chuyên mục">
              <button className={f.cat ? '' : 'on'} aria-pressed={!f.cat} onClick={() => set({ muc: '' })}>Tất cả</button>
              {chips.map((c) => (
                <button key={c.slug} className={f.cat === c.slug ? 'on' : ''} aria-pressed={f.cat === c.slug} onClick={() => pick(c.slug)}>
                  {c.name} <span className="n">{c.n}</span>
                </button>
              ))}
            </div>
          )}
          <div className="filter-row">
            <input type="search" aria-label="Lọc theo từ khóa" placeholder="Lọc theo từ khóa" value={f.kw} onChange={(e) => set({ loc: e.target.value })} />
            <select aria-label="Thời gian đăng" value={f.time} onChange={(e) => setTime(e.target.value)}>
              <option value="">Mọi thời gian</option>
              <option value="7">7 ngày qua</option>
              <option value="30">30 ngày qua</option>
              <option value="90">3 tháng qua</option>
              <option value="nam">Năm nay</option>
              <option value="khoang">Khoảng ngày…</option>
            </select>
            {f.time === 'khoang' && (
              <span className="range">
                <label>Từ <input type="date" value={f.from} max={f.to || undefined} onChange={(e) => set({ tu: e.target.value })} /></label>
                <label>đến <input type="date" value={f.to} min={f.from || undefined} onChange={(e) => set({ den: e.target.value })} /></label>
              </span>
            )}
            <select aria-label="Sắp xếp" value={f.sort} onChange={(e) => set({ sap: e.target.value === 'cu' ? 'cu' : '' })}>
              <option value="moi">Mới nhất trước</option>
              <option value="cu">Cũ nhất trước</option>
            </select>
            {filtering ? <button className="linkbtn" onClick={clear}>Xóa bộ lọc</button> : null}
          </div>
        </div>
      )}

      {!posts && <p className="empty">Đang tải…</p>}
      {posts && !posts.length && fixed.length === 0 && <p className="empty">Chưa có bài viết.</p>}
      {posts && posts.length > 0 && !shown.length && <p className="empty">Không có bài nào khớp bộ lọc.</p>}
      <div className="grid">
        {shown.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((p) => (
          <PostCard key={p.id} post={p} cat={cats.find((c) => c.slug === p.category)} />
        ))}
      </div>
      {pageCount > 1 && (
        <div className="pager">
          {Array.from({ length: pageCount }, (_, i) => (
            <button key={i} className={page === i + 1 ? 'on' : ''} aria-label={`Trang ${i + 1}`} aria-current={page === i + 1} onClick={() => setPage(i + 1)}>{i + 1}</button>
          ))}
        </div>
      )}
    </>
  );
}
