import React, { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { api, fmtDate } from '../api';
import { Files, Markdown, Pin, PostCard } from './parts';

export default function PostPage() {
  const { slug } = useParams();
  const { cats } = useOutletContext();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setPost(null);
    setRelated([]);
    setError('');
    window.scrollTo(0, 0);
    api.post(slug)
      .then((p) => {
        setPost(p);
        return api.posts({ category: p.category, limit: 6 });
      })
      .then((list) => setRelated(list.filter((x) => x.slug !== slug).slice(0, 3)))
      .catch((e) => setError(e.message));
  }, [slug]);

  if (error) return <p className="empty">{error}</p>;
  if (!post) return <p className="empty">Đang tải…</p>;

  const cat = cats.find((c) => c.slug === post.category);
  const parent = cat?.parent && cats.find((c) => c.slug === cat.parent);

  return (
    <>
      <article className="article">
        <p className="crumb">
          <Link to="/">Trang chủ</Link>
          {parent && <> › <Link to={`/muc/${parent.slug}`}>{parent.name}</Link></>}
          {cat && <> › <Link to={`/muc/${cat.slug}`}>{cat.name}</Link></>}
        </p>
        <h1>{post.title}</h1>
        <p className="meta">
          {cat && <span className="cat">{cat.name}</span>} <Pin post={post} /> <time className="date">{fmtDate(post.createdAt)}</time>
        </p>
        {post.coverImage && <img className="post-cover" src={post.coverImage} alt="" />}
        <Markdown>{post.content}</Markdown>
        <Files files={post.files} />
      </article>

      {related.length > 0 && (
        <>
          <h2 className="label related">Bài liên quan</h2>
          <div className="grid">{related.map((p) => <PostCard key={p.id} post={p} cat={cat} />)}</div>
        </>
      )}
    </>
  );
}
