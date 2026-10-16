import React, { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { PostCard } from './parts';
import { childrenOf } from './tree';

const PER_PAGE = 9;

export default function PostList() {
  const { slug } = useParams(); // undefined on /tim-kiem
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const { cats, pages } = useOutletContext();
  const [posts, setPosts] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPosts(null);
    setPage(1);
    api.posts({ category: slug, q }).then(setPosts).catch(() => setPosts([]));
  }, [slug, q]);

  const cat = cats.find((c) => c.slug === slug);
  const parent = cat?.parent && cats.find((c) => c.slug === cat.parent);
  const title = slug ? cat?.name || '' : `Kết quả cho “${q}”`;
  // fixed pages and sub-categories filed under this one, so every section is reachable from its own page
  const subs = slug ? [...pages.filter((p) => p.group === slug).map((p) => ({ to: `/trang/${p.slug}`, name: p.title })), ...childrenOf(cats, slug).map((c) => ({ to: `/muc/${c.slug}`, name: c.name }))] : [];
  const pageCount = posts ? Math.ceil(posts.length / PER_PAGE) : 0;

  return (
    <>
      <div className="pagehead">
        {parent && <p className="crumb"><Link to="/">Trang chủ</Link> › <Link to={`/muc/${parent.slug}`}>{parent.name}</Link></p>}
        <h1>{title}</h1>
        {posts && (posts.length > 0 || subs.length === 0) && <p>{posts.length} bài viết</p>}
      </div>

      {subs.length > 0 && (
        <ul className="subnav">
          {subs.map((s) => <li key={s.to}><Link to={s.to}>{s.name}</Link></li>)}
        </ul>
      )}

      {!posts && <p className="empty">Đang tải…</p>}
      {posts && !posts.length && subs.length === 0 && <p className="empty">Chưa có bài viết.</p>}
      {posts && (
        <div className="grid">
          {posts.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((p) => (
            <PostCard key={p.id} post={p} cat={cats.find((c) => c.slug === p.category)} />
          ))}
        </div>
      )}
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
