import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Markdown } from './parts';
import { childrenOf, topLevel } from './tree';

const DOCS = 'application/pdf,.doc,.docx,.xls,.xlsx';
const IMAGES = 'image/jpeg,image/png,image/webp,image/gif';

function Editor({ label, value, onChange }) {
  const [preview, setPreview] = useState(false);
  return (
    <div className="field">
      <div className="row between">
        <span className="lbl">{label}</span>
        <button type="button" className="linkbtn" onClick={() => setPreview(!preview)}>{preview ? 'Quay lại soạn thảo' : 'Xem trước'}</button>
      </div>
      {preview ? (
        <div className="preview-box"><Markdown>{value || '*Chưa có nội dung*'}</Markdown></div>
      ) : (
        <textarea rows="14" aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      <span className="hint">Markdown: **đậm**, [chữ hiển thị](https://địa-chỉ), "- " đầu dòng cho danh sách, "## " cho tiêu đề nhỏ, bảng dùng dấu |.</span>
    </div>
  );
}

function FilesField({ files, onChange, onError }) {
  const [busy, setBusy] = useState(false);
  const add = async (e) => {
    const picked = [...e.target.files];
    e.target.value = '';
    setBusy(true);
    let all = files;
    try {
      for (const f of picked) {
        all = [...all, { name: f.name, url: (await api.upload(f)).url }];
        onChange(all); // keep what already uploaded even if a later file fails
      }
      onError('');
    } catch (err) {
      onError(err.message);
    }
    setBusy(false);
  };
  return (
    <div className="field">
      <span className="lbl">Tệp đính kèm (PDF, Word, Excel, tối đa 15MB mỗi tệp)</span>
      <input type="file" multiple accept={DOCS} aria-label="Thêm tệp đính kèm" onChange={add} disabled={busy} />
      {files.length > 0 && (
        <ul className="rows">
          {files.map((f) => (
            <li key={f.url}>
              <a href={f.url} download={f.name}>{f.name}</a>
              <button type="button" className="linkbtn" onClick={() => onChange(files.filter((x) => x.url !== f.url))}>Gỡ</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// shared by the post and page forms: state, error, busy flag, the save call and a guarded cancel
function useSave(initial, save, onSaved, onCancel) {
  const [start] = useState(initial);
  const [f, setF] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      onSaved(await save(f));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };
  const dirty = JSON.stringify(f) !== JSON.stringify(start);
  const cancel = () => {
    if (!dirty || window.confirm('Bỏ các thay đổi chưa lưu?')) onCancel();
  };

  // while there are unsaved edits, ask before any link outside the form or closing the tab throws them away
  useEffect(() => {
    if (!dirty) return undefined;
    const leaving = (e) => {
      const link = e.target.closest?.('a[href]');
      if (link && !link.closest('form') && !window.confirm('Bỏ các thay đổi chưa lưu?')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const unload = (e) => { e.preventDefault(); e.returnValue = ''; };
    document.addEventListener('click', leaving, true);
    window.addEventListener('beforeunload', unload);
    return () => {
      document.removeEventListener('click', leaving, true);
      window.removeEventListener('beforeunload', unload);
    };
  }, [dirty]);
  return { f, setF, set, error, setError, busy, submit, cancel };
}

// remembered per browser, so each person on the shared account types their name once
const AUTHOR_KEY = 'hvu_author';
const rememberedAuthor = () => { try { return localStorage.getItem(AUTHOR_KEY) || ''; } catch { return ''; } };
const rememberAuthor = (name) => { try { localStorage.setItem(AUTHOR_KEY, name); } catch { /* private mode: just don't remember */ } };

const Actions = ({ busy, error, onCancel }) => (
  <>
    {error && <p className="err" role="alert">{error}</p>}
    <div className="row">
      <button className="btn" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu'}</button>
      <button type="button" className="btn ghost" onClick={onCancel}>Hủy</button>
    </div>
  </>
);

export function PostForm({ cats, initial, onSaved, onCancel }) {
  const empty = { title: '', excerpt: '', content: '', coverImage: '', category: '', isFeatured: false, pinned: false, pinnedUntil: '' };
  const { f, setF, set, error, setError, busy, submit, cancel } = useSave(
    { ...empty, ...initial, files: initial.files || [], author: initial.author ?? rememberedAuthor() },
    (post) => { rememberAuthor(post.author); return api.savePost(post); },
    onSaved,
    onCancel
  );

  // the post stores one slug: a child's, or the big section's own when no child is picked
  const current = cats.find((c) => c.slug === f.category);
  const group = current ? current.parent || current.slug : '';
  const kids = group ? childrenOf(cats, group) : []; // top-level categories have parent '', so never ask for children of ''

  const uploadCover = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setF({ ...f, coverImage: (await api.upload(file)).url });
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="box form" onSubmit={submit}>
      <h2>{f.id ? 'Sửa bài viết' : 'Bài viết mới'}</h2>
      <label>Tiêu đề<input value={f.title} onChange={set('title')} required /></label>
      <label>Mục lớn
        <select value={group} onChange={(e) => setF({ ...f, category: e.target.value })} required>
          <option value="" disabled>— Chọn mục lớn —</option>
          {topLevel(cats).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      </label>
      {kids.length > 0 && (
        <label>Mục con (bỏ trống thì bài thuộc thẳng mục đã chọn ở trên)
          <select value={f.category === group ? '' : f.category} onChange={(e) => setF({ ...f, category: e.target.value || group })}>
            <option value="">— Không chọn —</option>
            {kids.map((k) => <option key={k.slug} value={k.slug}>{k.name}</option>)}
          </select>
        </label>
      )}
      <label>Tóm tắt<textarea rows="2" value={f.excerpt} onChange={set('excerpt')} /></label>
      <Editor label="Nội dung" value={f.content} onChange={(content) => setF({ ...f, content })} />
      <label>Ảnh bìa (JPG, PNG, WEBP, GIF)<input type="file" accept={IMAGES} onChange={uploadCover} /></label>
      {f.coverImage && <img className="preview" src={f.coverImage} alt="" />}
      <FilesField files={f.files} onChange={(files) => setF((s) => ({ ...s, files }))} onError={setError} />
      <label className="check"><input type="checkbox" checked={f.isFeatured} onChange={set('isFeatured')} /> Bài nổi bật (hiện lớn ở trang chủ)</label>
      <label className="check"><input type="checkbox" checked={f.pinned} onChange={set('pinned')} /> Ghim vào “Thông báo quan trọng” ở trang chủ</label>
      {f.pinned && <label>Ghim đến hết ngày (để trống = ghim cho tới khi bỏ ghim)<input type="date" value={f.pinnedUntil} onChange={set('pinnedUntil')} /></label>}
      <label>Người đăng (chỉ hiện trong trang quản trị; máy này sẽ nhớ tên)<input value={f.author} onChange={set('author')} maxLength={80} /></label>
      <Actions busy={busy} error={error} onCancel={cancel} />
    </form>
  );
}

export function PageForm({ cats, initial, onSaved, onCancel }) {
  const empty = { title: '', content: '', group: '' };
  const { f, setF, set, error, setError, busy, submit, cancel } = useSave(
    { ...empty, ...initial, files: initial.files || [] },
    api.savePage,
    onSaved,
    onCancel
  );

  return (
    <form className="box form" onSubmit={submit}>
      <h2>{f.slug ? 'Sửa trang' : 'Trang mới'}</h2>
      <label>Tiêu đề<input value={f.title} onChange={set('title')} required /></label>
      <label>Hiện trong menu của mục
        <select value={f.group} onChange={set('group')}>
          <option value="">— Không hiện trong menu (chỉ vào bằng liên kết) —</option>
          {topLevel(cats).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      </label>
      <Editor label="Nội dung" value={f.content} onChange={(content) => setF({ ...f, content })} />
      <FilesField files={f.files} onChange={(files) => setF((s) => ({ ...s, files }))} onError={setError} />
      <Actions busy={busy} error={error} onCancel={cancel} />
    </form>
  );
}
