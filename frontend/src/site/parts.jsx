import React from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fmtDate } from '../api';

// react-markdown never renders raw HTML and strips javascript: links, so admin text is safe to show.
const external = ({ href, children }) =>
  /^https?:/.test(href || '') ? <a href={href} target="_blank" rel="noreferrer">{children}</a> : <a href={href}>{children}</a>;

export const Markdown = ({ children }) => (
  <div className="prose">
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: external }}>{children}</ReactMarkdown>
  </div>
);

export const Files = ({ files }) =>
  files?.length ? (
    <div className="files">
      <h2 className="label">Tệp đính kèm</h2>
      <ul className="rows">
        {files.map((f) => (
          <li key={f.url}><a href={f.url} download={f.name}>{f.name}</a></li>
        ))}
      </ul>
    </div>
  ) : null;

export const Pin = ({ post }) => (post.pinnedNow ? <span className="pin">Ghim</span> : null);

// Posts without a cover show the faculty logo instead of a broken image.
export const Cover = ({ post }) => (
  <img
    className={post.coverImage ? 'cover' : 'cover nocover'}
    src={post.coverImage || '/logo-khoa.png'}
    alt=""
    loading="lazy"
  />
);

export const DateLink = ({ post }) => (
  <li>
    <time className="date">{fmtDate(post.createdAt)}</time>
    <Pin post={post} />
    <Link to={`/bai-viet/${post.slug}`}>{post.title}</Link>
  </li>
);

export const PostCard = ({ post, cat }) => (
  <Link to={`/bai-viet/${post.slug}`} className="card">
    <Cover post={post} />
    <span className="cat">{cat?.name}<Pin post={post} /></span>
    <h3>{post.title}</h3>
    <time className="date">{fmtDate(post.createdAt)}</time>
  </Link>
);
