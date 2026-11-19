import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useOutletContext } from 'react-router-dom';
import { api, fmtDate } from '../api';
import { Cover, DateLink } from './parts';
import { topLevel, treeSlugs } from './tree';
import Intro from './Intro';
import Slides from './Slides';
import { EditPin, MoveButtons, PostTools, useAdmin, useAdminAction, useHere } from './admin/OnSite';
import { newPostHref, settingsHref } from './admin/links';
import { move } from './admin/order';
import FeaturedPicker from './admin/FeaturedPicker';
import { Star } from 'lucide-react';

export default function Home() {
  const { cats, site, reload } = useOutletContext();
  const { admin } = useAdmin();
  const here = useHere();
  const act = useAdminAction();
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(false);
  const { hash, key } = useLocation(); // key changes on every click, even to the same #anchor

  const load = useCallback(() => api.posts().then(setPosts).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  // the router does not scroll to #anchors itself; wait for posts because the page renders only after they load
  useEffect(() => {
    if (posts && hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [posts, hash, key]);

  if (error) return <p className="page empty">{error}</p>;
  if (!posts) return <p className="page empty">Đang tải…</p>;

  // pinned notices get their own block, so the lead story and the list never repeat them
  const pinned = posts.filter((p) => p.pinnedNow);
  const normal = posts.filter((p) => !p.pinnedNow);
  const featured = normal.filter((p) => p.isFeatured).slice(0, 5);
  const slides = featured.length ? featured : normal.slice(0, 1);
  const lead = slides[0];
  const latest = normal.filter((p) => !slides.includes(p)).slice(0, 6);

  // one column per top-level category (its children's posts count), skipping what the slides and "Tin mới" already show
  const shown = new Set([...slides, ...latest, ...pinned].map((p) => p.id));
  const tops = topLevel(cats);
  const columns = tops
    .map((c) => ({ ...c, posts: normal.filter((p) => !shown.has(p.id) && treeSlugs(cats, c.slug).includes(p.category)).slice(0, 4) }))
    .filter((c) => c.posts.length > 0);

  const tools = (p) => admin && <PostTools post={p} onChanged={load} />;
  // a column moves within the menu order of all sections, so the menu and the home page stay in step
  const moveColumn = (slug, dir) => {
    const next = move(tops.map((c) => c.slug), tops.findIndex((c) => c.slug === slug), dir);
    if (next) act(async () => { await api.reorderCategories(next); await reload(); });
  };

  return (
    <>
      <section className={site.heroImage ? 'hero photo' : 'hero'} style={site.heroImage ? { '--hero': `url(${JSON.stringify(site.heroImage)})` } : undefined}>
        <div className="page hero-in">
          <div>
            <h1>{site.name}</h1>
            <p>{[site.university, site.tagline].filter(Boolean).join(' · ')}</p>
            <div className="cta">
              <Link className="btn light" to="/#gioi-thieu">Giới thiệu khoa</Link>
              {site.facebook && <a className="btn line" href={site.facebook} target="_blank" rel="noreferrer">Facebook</a>}
              <EditPin to={settingsHref(here)} label="Sửa ảnh nền & thông tin khoa" className="on-dark" />
            </div>
          </div>
          <img src={site.logo || '/logo-khoa.png'} alt={`Logo ${site.name || ''}`} width="200" height="200" />
        </div>
      </section>

      <div className="page">
        {pinned.length > 0 && (
          <section className="notice">
            <h2 className="label">Thông báo quan trọng</h2>
            <ul className="rows">{pinned.map((p) => <DateLink key={p.id} post={p} tools={tools(p)} />)}</ul>
          </section>
        )}

        {lead && (
          <section className="news">
            <div>
              <Slides posts={slides} cats={cats} tools={tools} />
              {admin && <button type="button" className="edit-pin pick-btn" onClick={() => setPicking(true)}><Star size={13} aria-hidden="true" /> Chọn bài nổi bật</button>}
            </div>
            <div>
              <h2 className="label">Tin mới</h2>
              <ul className="rows">{latest.map((p) => <DateLink key={p.id} post={p} tools={tools(p)} />)}</ul>
            </div>
          </section>
        )}

        <section className="cols">
          {columns.map((c) => (
            <div key={c.slug}>
              <h2 className="label">
                <Link to={`/muc/${c.slug}`}>{c.name}</Link>
                <MoveButtons index={tops.findIndex((t) => t.slug === c.slug)} count={tops.length} onMove={(dir) => moveColumn(c.slug, dir)} label={`mục ${c.name}`} />
              </h2>
              <Link to={`/bai-viet/${c.posts[0].slug}`} className="col-lead">
                <Cover post={c.posts[0]} />
                <span>
                  <h3>{c.posts[0].title}</h3>
                  <time className="date">{fmtDate(c.posts[0].createdAt)}</time>
                </span>
              </Link>
              {tools(c.posts[0])}
              <ul className="rows">{c.posts.slice(1).map((p) => <DateLink key={p.id} post={p} tools={tools(p)} />)}</ul>
              <Link className="more" to={`/muc/${c.slug}`}>Xem tất cả →</Link>
              <EditPin to={newPostHref(c.slug, here)} label="+ Viết bài trong mục này" />
            </div>
          ))}
        </section>

        {picking && <FeaturedPicker posts={posts} onChanged={load} onClose={() => setPicking(false)} />}

        <section id="gioi-thieu" className="anchor">
          <Intro />
        </section>
      </div>
    </>
  );
}
