import React from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fmtDate } from '../api';

// react-markdown never renders raw HTML and strips javascript: links, so admin text is safe to show.
const external = ({ href, children }) =>
  /^https?:/.test(href || '') ? <a href={href} target="_blank" rel="noreferrer">{children}</a> : <a href={href}>{children}</a>;

// wide tables scroll inside their own box instead of widening the page
const table = ({ children }) => <div className="tablewrap"><table>{children}</table></div>;

export const Markdown = ({ children }) => (
  <div className="prose">
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: external, table }}>{children}</ReactMarkdown>
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

// `tools` = the admin's buttons for this post (nothing for visitors), kept outside the link
export const DateLink = ({ post, tools }) => (
  <li>
    <time className="date">{fmtDate(post.createdAt)}</time>
    <Pin post={post} />
    <Link to={`/bai-viet/${post.slug}`}>{post.title}</Link>
    {tools}
  </li>
);

// a list row with a small picture, title and date: the home page's "Tin mới"
export const ThumbLink = ({ post, tools }) => (
  <li className="thumb-row">
    <Link to={`/bai-viet/${post.slug}`} className="thumb-link">
      <Cover post={post} />
      <span>
        <span className="thumb-title">{post.title}</span>
        <time className="date">{fmtDate(post.createdAt)}</time>
      </span>
    </Link>
    {tools}
  </li>
);

export const PostCard = ({ post, cat, tools }) => (tools ? <div className="card-wrap"><Card post={post} cat={cat} />{tools}</div> : <Card post={post} cat={cat} />);

const Card = ({ post, cat }) => (
  <Link to={`/bai-viet/${post.slug}`} className="card">
    <Cover post={post} />
    <span className="cat">{cat?.name}<Pin post={post} /></span>
    <h3>{post.title}</h3>
    <time className="date">{fmtDate(post.createdAt)}</time>
  </Link>
);
