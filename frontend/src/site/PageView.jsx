import React, { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { Files, Markdown } from './parts';
import { api } from '../api';
import { ContactCard, iconFor, plain } from './SectionHub';

export default function PageView() {
  const { slug } = useParams();
  const { cats, pages, site } = useOutletContext();
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

  return <PageArticle page={page} cats={cats} pages={pages} site={site} />;
}

// also rendered by the admin's preview, which may not pass pages or site
export function PageArticle({ page, cats, pages = [], site = {} }) {
  const group = cats.find((c) => c.slug === page.group);
  const siblings = group ? pages.filter((p) => p.group === group.slug) : [];
  const thin = plain(page.content).length < 80; // a page still waiting for its content

  return (
    <div className="doc">
      <article className="article doc-main">
        <p className="crumb">
          <Link to="/">Trang chủ</Link>
          {group && <> › <Link to={`/muc/${group.slug}`}>{group.name}</Link></>}
        </p>
        <h1>{page.title}</h1>
        <Markdown>{page.content}</Markdown>
        {thin && (site.email || site.phone) && (
          <p className="note">
            Nội dung trang này đang được khoa bổ sung. Cần thông tin ngay, vui lòng liên hệ
            {site.phone && <> điện thoại <a href={`tel:${site.phone.replace(/\s/g, '')}`}>{site.phone}</a></>}
            {site.phone && site.email && ' hoặc'}
            {site.email && <> email <a href={`mailto:${site.email}`}>{site.email}</a></>}.
          </p>
        )}
        <Files files={page.files} />
      </article>

      {(siblings.length > 1 || site.address || site.phone || site.email) && (
        <aside className="doc-side">
          {siblings.length > 1 && (
            <nav className="side-nav" aria-label={`Các trang trong mục ${group.name}`}>
              <h2>{group.name}</h2>
              <ul>
                {siblings.map((p) => {
                  const Icon = iconFor(p.title);
                  const here = p.slug === page.slug;
                  return (
                    <li key={p.slug}>
                      <Link to={`/trang/${p.slug}`} className={here ? 'on' : ''} aria-current={here ? 'page' : undefined}>
                        <Icon size={17} aria-hidden="true" /> {p.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}
          <ContactCard site={site} />
        </aside>
      )}
    </div>
  );
}
