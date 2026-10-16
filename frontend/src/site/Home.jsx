import React, { useEffect, useState } from 'react';
import { Link, useLocation, useOutletContext } from 'react-router-dom';
import { api, fmtDate } from '../api';
import { Cover, DateLink } from './parts';
import { topLevel, treeSlugs } from './tree';
import Intro from './Intro';

export default function Home() {
  const { cats, site } = useOutletContext();
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState('');
  const { hash, key } = useLocation(); // key changes on every click, even to the same #anchor

  useEffect(() => {
    api.posts().then(setPosts).catch((e) => setError(e.message));
  }, []);

  // the router does not scroll to #anchors itself; wait for posts because the page renders only after they load
  useEffect(() => {
    if (posts && hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [posts, hash, key]);

  if (error) return <p className="page empty">{error}</p>;
  if (!posts) return <p className="page empty">Đang tải…</p>;

  // pinned notices get their own block, so the lead story and the list never repeat them
  const pinned = posts.filter((p) => p.pinnedNow);
  const normal = posts.filter((p) => !p.pinnedNow);
  const lead = normal.find((p) => p.isFeatured) || normal[0];
  const latest = normal.filter((p) => p !== lead).slice(0, 6);
  const leadCat = lead && cats.find((c) => c.slug === lead.category);

  // one column per top-level category that has posts (its children's posts count)
  const columns = topLevel(cats)
    .map((c) => ({ ...c, posts: posts.filter((p) => treeSlugs(cats, c.slug).includes(p.category)).slice(0, 4) }))
    .filter((c) => c.posts.length > 0);

  return (
    <>
      <section className="hero">
        <div className="page hero-in">
          <div>
            <h1>{site.name}</h1>
            <p>{[site.university, site.tagline].filter(Boolean).join(' · ')}</p>
            <div className="cta">
              <Link className="btn light" to="/#gioi-thieu">Giới thiệu khoa</Link>
              {site.facebook && <a className="btn line" href={site.facebook} target="_blank" rel="noreferrer">Facebook</a>}
            </div>
          </div>
          <img src="/logo-khoa.png" alt={`Logo ${site.name || ''}`} width="200" height="200" />
        </div>
      </section>

      <div className="page">
        {pinned.length > 0 && (
          <section className="notice">
            <h2 className="label">Thông báo quan trọng</h2>
            <ul className="rows">{pinned.map((p) => <DateLink key={p.id} post={p} />)}</ul>
          </section>
        )}

        {lead && (
          <section className="news">
            <Link className="lead" to={`/bai-viet/${lead.slug}`}>
              <Cover post={lead} />
              {leadCat && <span className="cat">{leadCat.name}</span>}
              <h2>{lead.title}</h2>
              <p>{lead.excerpt}</p>
              <time className="date">{fmtDate(lead.createdAt)}</time>
            </Link>
            <div>
              <h2 className="label">Tin mới</h2>
              <ul className="rows">{latest.map((p) => <DateLink key={p.id} post={p} />)}</ul>
            </div>
          </section>
        )}

        <section className="cols">
          {columns.map((c) => (
            <div key={c.slug}>
              <h2 className="label"><Link to={`/muc/${c.slug}`}>{c.name}</Link></h2>
              <ul className="rows">{c.posts.map((p) => <DateLink key={p.id} post={p} />)}</ul>
              <Link className="more" to={`/muc/${c.slug}`}>Xem tất cả →</Link>
            </div>
          ))}
        </section>

        <section id="gioi-thieu" className="anchor">
          <Intro />
        </section>
      </div>
    </>
  );
}
