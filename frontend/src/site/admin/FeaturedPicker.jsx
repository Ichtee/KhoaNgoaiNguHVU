import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { api, fmtDate } from '../../api';
import { useAdmin } from './OnSite';

const MAX = 5; // the home slides show five

// Tick which posts the home page shows as featured slides. Each tick saves at once.
export default function FeaturedPicker({ posts, onChanged, onClose }) {
  const { signOut } = useAdmin();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const box = useRef(null);
  const list = posts.slice(0, 30);
  const count = posts.filter((p) => p.isFeatured).length;

  useEffect(() => {
    box.current?.querySelector('input:not(:disabled), button')?.focus();
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  const toggle = async (p) => {
    setBusy(p.id);
    setError('');
    try {
      await api.savePost({ ...p, isFeatured: !p.isFeatured });
      await onChanged();
    } catch (err) {
      if (/đăng nhập/i.test(err.message)) { alert('Phiên đăng nhập đã hết, hãy đăng nhập lại.'); signOut(); onClose(); } else setError(err.message);
    }
    setBusy('');
  };

  return (
    <div className="picker-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="picker" role="dialog" aria-modal="true" aria-labelledby="picker-title" ref={box}>
        <div className="picker-head">
          <h2 id="picker-title">Chọn bài nổi bật <span className="hint">({count}/{MAX})</span></h2>
          <button type="button" className="tool" aria-label="Đóng" onClick={onClose}><X size={18} aria-hidden="true" /></button>
        </div>
        <p className="hint">Bài được chọn hiện ở khối trình chiếu đầu trang chủ. Trang chủ hiện tối đa {MAX} bài nổi bật.</p>
        {error && <p className="err" role="alert">{error}</p>}
        <ul className="picker-list">
          {list.map((p) => (
            <li key={p.id}>
              <label>
                <input type="checkbox" checked={!!p.isFeatured} disabled={busy !== '' || (!p.isFeatured && count >= MAX)} onChange={() => toggle(p)} />
                <span className="picker-title">{p.title}</span>
                <time className="date">{fmtDate(p.createdAt)}</time>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
