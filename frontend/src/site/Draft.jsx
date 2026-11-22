import React, { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { DRAFT_KEY } from './AdminForms';
import { DateLink, PostCard } from './parts';
import { PostArticle } from './PostPage';
import { PageArticle } from './PageView';
import Slides from './Slides';

const read = () => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY)); } catch { return null; } };

// The unsaved form from the admin, drawn inside the real site layout. It lives only in this browser's storage.
export default function Draft() {
  const { cats, pages, site } = useOutletContext();
  const [draft, setDraft] = useState(read);
  const [broken, setBroken] = useState([]);
  const box = useRef(null);

  // the admin tab writes on every keystroke; the storage event tells this tab
  useEffect(() => {
    const on = (e) => e.key === DRAFT_KEY && setDraft(read());
    window.addEventListener('storage', on);
    return () => window.removeEventListener('storage', on);
  }, []);

  // image error/load events do not bubble, but capture on the wrapper still sees them
  useEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const check = () => setBroken([...new Set(
      [...el.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute('src') || '(trống)')
    )]);
    check();
    el.addEventListener('error', check, true);
    el.addEventListener('load', check, true);
    return () => { el.removeEventListener('error', check, true); el.removeEventListener('load', check, true); };
  }, [draft]);

  if (!draft?.data) {
    return <p className="empty">Không có bản nháp nào đang mở. Hãy mở một bài trong trang Quản trị rồi bấm “Xem nháp trên website”.</p>;
  }

  const f = draft.data;
  const post = { ...f, id: f.id || 'draft', slug: f.slug || 'draft', title: f.title || '(Chưa có tiêu đề)', createdAt: f.createdAt || new Date().toISOString(), pinnedNow: f.pinned };
  const cat = cats.find((c) => c.slug === f.category);

  return (
    <>
      <div className="draft-bar" role="status">
        <b>BẢN NHÁP — chưa đăng.</b> Trang này tự cập nhật khi bạn sửa trong trang Quản trị. Bấm Lưu ở đó để đăng.
      </div>
      {broken.length > 0 && (
        <div className="draft-bar bad" role="alert">
          <b>{broken.length} ảnh không hiển thị được:</b>
          <ul>{broken.map((src) => <li key={src}><code>{src}</code></li>)}</ul>
          Hãy tải lại ảnh, hoặc kiểm tra đường dẫn ảnh trong nội dung (phải bắt đầu bằng https:// hoặc /uploads/).
        </div>
      )}

      <div ref={box}>
        {draft.kind === 'page' ? (
          <PageArticle page={{ ...f, title: f.title || '(Chưa có tiêu đề)' }} cats={cats} pages={pages} site={site} />
        ) : (
          <>
            <PostArticle post={post} cats={cats} />
            <h2 className="label related">Bài sẽ hiện ở trang chủ như sau</h2>
            <div className="draft-home">
              {f.pinned && <div><h3 className="label">Thông báo quan trọng</h3><ul className="rows"><DateLink post={post} /></ul></div>}
              {f.pinned || <Slides posts={[post]} cats={cats} />}
            </div>
            <h2 className="label related">Trong danh sách của mục</h2>
            <div className="grid"><PostCard post={post} cat={cat} /></div>
          </>
        )}
      </div>
    </>
  );
}
