import React, { createContext, useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowDown, ArrowUp, Pencil, Pin, Settings, Star, Trash2 } from 'lucide-react';
import { api } from '../../api';
import { editPostHref, menuHref, newPageHref, newPostHref, settingsHref } from './links';

// Whether the person browsing is the logged-in admin. Layout provides it; everything below only shows when it is true,
// so a visitor sees exactly the public site.
export const AdminContext = createContext({ admin: false, signOut() {}, refresh() {} });
export const useAdmin = () => useContext(AdminContext);

// the current address, sent along so the editor can come back here
export function useHere() {
  const { pathname, search } = useLocation();
  return pathname + search;
}

const EXPIRED = 'Phiên đăng nhập đã hết, hãy đăng nhập lại.';
const isExpired = (err) => /đăng nhập/i.test(err.message);

export function AdminBar() {
  const { admin, signOut } = useAdmin();
  const here = useHere();
  const { pathname } = useLocation();
  if (!admin || pathname.startsWith('/quan-tri')) return null;
  return (
    <div className="admin-bar" role="region" aria-label="Công cụ quản trị">
      <div className="page admin-bar-in">
        <span className="admin-bar-who">Đang xem với quyền quản trị</span>
        <Link to="/quan-tri"><Settings size={15} aria-hidden="true" /> Trang quản trị</Link>
        <Link to={newPostHref('', here)}>+ Viết bài</Link>
        <Link to={newPageHref('', here)}>+ Trang mới</Link>
        <Link to={settingsHref(here)}>Sửa thông tin khoa</Link>
        <Link to={menuHref(here)}>Sửa menu</Link>
        <button type="button" onClick={signOut}>Đăng xuất</button>
      </div>
    </div>
  );
}

// a small "✎ Sửa …" link to the editor of the thing next to it
export function EditPin({ to, label = 'Sửa', className = '' }) {
  const { admin } = useAdmin();
  if (!admin) return null;
  return (
    <Link className={`edit-pin ${className}`} to={to} title={label}>
      <Pencil size={13} aria-hidden="true" /> {label}
    </Link>
  );
}

// ★ featured, 📌 pinned, ✎ edit, 🗑 delete — on any post shown on the public site
export function PostTools({ post, onChanged, onDeleted, className = '' }) {
  const { admin, signOut } = useAdmin();
  const here = useHere();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!admin) return null;

  const run = async (fn, after = onChanged) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      after?.();
    } catch (err) {
      if (isExpired(err)) { alert(EXPIRED); signOut(); } else setError(err.message);
    }
    setBusy(false);
  };
  const toggle = (key) => run(() => api.savePost({ ...post, [key]: !post[key] }));
  const remove = () => {
    if (window.confirm(`Xóa bài “${post.title}”? Không thể hoàn tác.`)) run(() => api.deletePost(post.id), onDeleted || onChanged);
  };

  return (
    <span className={`post-tools ${className}`}>
      <Link className="tool" to={editPostHref(post.slug, here)} aria-label={`Sửa bài “${post.title}”`} title="Sửa"><Pencil size={15} aria-hidden="true" /></Link>
      <button type="button" className={post.isFeatured ? 'tool on' : 'tool'} aria-pressed={!!post.isFeatured} aria-label="Bài nổi bật" title="Bài nổi bật" disabled={busy} onClick={() => toggle('isFeatured')}><Star size={15} aria-hidden="true" /></button>
      <button type="button" className={post.pinned ? 'tool on' : 'tool'} aria-pressed={!!post.pinned} aria-label="Ghim lên thông báo quan trọng" title="Ghim" disabled={busy} onClick={() => toggle('pinned')}><Pin size={15} aria-hidden="true" /></button>
      <button type="button" className="tool danger" aria-label={`Xóa bài “${post.title}”`} title="Xóa" disabled={busy} onClick={remove}><Trash2 size={15} aria-hidden="true" /></button>
      {error && <span className="tool-err" role="alert">{error}</span>}
    </span>
  );
}

// ↑ ↓ for one item of an ordered group
export function MoveButtons({ index, count, onMove, label = '' }) {
  const { admin } = useAdmin();
  if (!admin || count < 2) return null;
  return (
    <span className="move-btns">
      <button type="button" className="tool" aria-label={`Đưa lên ${label}`.trim()} title="Đưa lên" disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp size={15} aria-hidden="true" /></button>
      <button type="button" className="tool" aria-label={`Đưa xuống ${label}`.trim()} title="Đưa xuống" disabled={index === count - 1} onClick={() => onMove(1)}><ArrowDown size={15} aria-hidden="true" /></button>
    </span>
  );
}

// runs an admin write from the public site; an expired session signs out with a message
export function useAdminAction() {
  const { signOut } = useAdmin();
  return async (fn) => {
    try {
      await fn();
    } catch (err) {
      if (isExpired(err)) { alert(EXPIRED); signOut(); } else alert(err.message);
    }
  };
}
