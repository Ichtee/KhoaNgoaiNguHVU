import React, { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { api } from '../api';
import { Files, Markdown } from './parts';

export default function PageView() {
  const { slug } = useParams();
  const { cats } = useOutletContext();
  const [page, setPage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setPage(null);
    setError('');
    window.scrollTo(0, 0);
    api.page(slug).then(setPage).catch((e) => setError(e.message));
  }, [slug]);

  if (error) return <p className="empty">{error}</p>;
  if (!page) return <p className="empty">Đang tải…</p>;

  const group = cats.find((c) => c.slug === page.group);

  return (
    <article className="article">
      <p className="crumb">
        <Link to="/">Trang chủ</Link>
        {group && <> › <Link to={`/muc/${group.slug}`}>{group.name}</Link></>}
      </p>
      <h1>{page.title}</h1>
      <Markdown>{page.content}</Markdown>
      <Files files={page.files} />
    </article>
  );
}
