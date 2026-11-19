import React, { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Camera, Eye, ImagePlus, X } from 'lucide-react';
import { api } from '../api';
import { childrenOf, topLevel } from './tree';

const DOCS = 'application/pdf,.doc,.docx,.xls,.xlsx';
const IMAGES = 'image/jpeg,image/png,image/webp,image/gif';

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

// The draft tab (/xem-nhap, see Draft.jsx) reads the form from here and redraws on every change.
export const DRAFT_KEY = 'hvu_draft';
function useDraft(kind, data) {
  const json = JSON.stringify({ kind, data });
  useEffect(() => { try { localStorage.setItem(DRAFT_KEY, json); } catch { /* private mode: the draft tab says there is nothing */ } }, [json]);
  useEffect(() => () => { try { localStorage.removeItem(DRAFT_KEY); } catch { /* same */ } }, []);
}

const Actions = ({ busy, error, onCancel }) => (
  <div className="form-bar">
    {error && <p className="err" role="alert">{error}</p>}
    <div className="row wrap">
      <button className="btn" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu'}</button>
      {/* a link inside the form, so the unsaved-changes guard lets it through */}
      <a className="btn ghost" href="/xem-nhap" target="_blank" rel="noreferrer"><Eye size={18} /> Xem nháp trên website</a>
      <button type="button" className="btn ghost" onClick={onCancel}>Hủy</button>
    </div>
  </div>
);

// the body editor is big; it is fetched only when a post or page is opened for editing
const RichEditor = lazy(() => import('./editor/RichEditor'));
const Body = (props) => (
  <Suspense fallback={<p className="empty">Đang mở trình soạn thảo…</p>}>
    <RichEditor {...props} />
  </Suspense>
);

// a textarea that grows with its text, styled by its class to look like the published title or lead
function Grow({ className, value, onChange, label, placeholder, required, oneLine }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea ref={ref} rows={1} className={className} aria-label={label} placeholder={placeholder} required={required} value={value}
      onChange={(e) => onChange(oneLine ? e.target.value.replace(/\s*\n+\s*/g, ' ') : e.target.value)}
      onKeyDown={(e) => { if (oneLine && e.key === 'Enter') e.preventDefault(); }} />
  );
}

// The cover where readers see it, with its controls on the picture, as on a social profile.
export function CoverField({ url, onChange, onError }) {
  const [busy, setBusy] = useState(false);
  const pick = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      onChange((await api.upload(file)).url);
      onError('');
    } catch (err) {
      onError(err.message);
    }
    setBusy(false);
  };
  const input = <input type="file" accept={IMAGES} onChange={pick} disabled={busy} />;
  if (!url) {
    return (
      <label className="cover-edit empty">
        <ImagePlus size={28} aria-hidden="true" />
        <span>{busy ? 'Đang tải ảnh lên…' : '+ Thêm ảnh bìa'}</span>
        {input}
      </label>
    );
  }
  return (
    <div className="cover-edit">
      <img src={url} alt="Ảnh bìa" />
      <div className="cover-tools">
        <label className="cover-btn"><Camera size={16} aria-hidden="true" /> {busy ? 'Đang tải…' : 'Đổi ảnh bìa'}{input}</label>
        <button type="button" className="cover-btn" onClick={() => onChange('')}><X size={16} aria-hidden="true" /> Gỡ</button>
      </div>
    </div>
  );
}

const Side = ({ children, busy, error, onCancel }) => (
  <aside className="studio-side">
    <Actions busy={busy} error={error} onCancel={onCancel} />
    <div className="studio-settings">{children}</div>
  </aside>
);

export function PostForm({ cats, initial, onSaved, onCancel }) {
  const empty = { title: '', excerpt: '', content: '', coverImage: '', category: '', isFeatured: false, pinned: false, pinnedUntil: '' };
  const { f, setF, set, error, setError, busy, submit, cancel } = useSave(
    { ...empty, ...initial, files: initial.files || [], author: initial.author ?? rememberedAuthor() },
    (post) => { rememberAuthor(post.author); return api.savePost(post); },
    onSaved,
    onCancel
  );
  useDraft('post', f);

  // the post stores one slug: a child's, or the big section's own when no child is picked
  const current = cats.find((c) => c.slug === f.category);
  const group = current ? current.parent || current.slug : '';
  const kids = group ? childrenOf(cats, group) : []; // top-level categories have parent '', so never ask for children of ''
  const field = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  return (
    <form className="studio" onSubmit={submit}>
      <div className="studio-canvas article">
        <p className="studio-kicker">{f.id ? 'Sửa bài viết' : 'Bài viết mới'}</p>
        <CoverField url={f.coverImage} onChange={field('coverImage')} onError={setError} />
        <span className="cat">{current ? current.name : 'Chưa chọn chuyên mục'}</span>
        <Grow className="studio-title" label="Tiêu đề" placeholder="Tiêu đề bài viết" required oneLine value={f.title} onChange={field('title')} />
        <Grow className="studio-lead" label="Tóm tắt" placeholder="Tóm tắt ngắn hiện ở danh sách bài…" value={f.excerpt} onChange={field('excerpt')} />
        <Body value={f.content} onChange={field('content')} alt={f.title} onError={setError} onCover={field('coverImage')} />
        <FilesField files={f.files} onChange={field('files')} onError={setError} />
      </div>
      <Side busy={busy} error={error} onCancel={cancel}>
        <label>Mục lớn
          <select value={group} onChange={(e) => setF({ ...f, category: e.target.value })} required>
            <option value="" disabled>— Chọn mục lớn —</option>
            {topLevel(cats).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </label>
        {kids.length > 0 && (
          <label>Mục con
            <select value={f.category === group ? '' : f.category} onChange={(e) => setF({ ...f, category: e.target.value || group })}>
              <option value="">— Không chọn —</option>
              {kids.map((k) => <option key={k.slug} value={k.slug}>{k.name}</option>)}
            </select>
          </label>
        )}
        <label className="check"><input type="checkbox" checked={f.isFeatured} onChange={set('isFeatured')} /> Bài nổi bật (hiện lớn ở trang chủ)</label>
        <label className="check"><input type="checkbox" checked={f.pinned} onChange={set('pinned')} /> Ghim vào “Thông báo quan trọng”</label>
        {f.pinned && <label>Ghim đến hết ngày (để trống = ghim cho tới khi bỏ ghim)<input type="date" value={f.pinnedUntil} onChange={set('pinnedUntil')} /></label>}
        <label>Người đăng (chỉ hiện trong trang quản trị)<input value={f.author} onChange={set('author')} maxLength={80} /></label>
      </Side>
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
  useDraft('page', f);
  const field = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const group = cats.find((c) => c.slug === f.group);

  return (
    <form className="studio" onSubmit={submit}>
      <div className="studio-canvas article">
        <p className="studio-kicker">{f.slug ? 'Sửa trang' : 'Trang mới'}</p>
        <span className="cat">{group ? group.name : 'Không hiện trong menu'}</span>
        <Grow className="studio-title" label="Tiêu đề" placeholder="Tiêu đề trang" required oneLine value={f.title} onChange={field('title')} />
        <Body value={f.content} onChange={field('content')} alt={f.title} onError={setError} />
        <FilesField files={f.files} onChange={field('files')} onError={setError} />
      </div>
      <Side busy={busy} error={error} onCancel={cancel}>
        <label>Hiện trong menu của mục
          <select value={f.group} onChange={set('group')}>
            <option value="">— Không hiện trong menu (chỉ vào bằng liên kết) —</option>
            {topLevel(cats).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </label>
      </Side>
    </form>
  );
}
