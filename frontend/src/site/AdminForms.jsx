import React, { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Camera, Eye, ImagePlus, X } from 'lucide-react';
import { api } from '../api';
import { childrenOf, topLevel } from './tree';
import { plain } from './SectionHub';

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

// the bar under the form, always in view: one big button that publishes, and a way out
const Actions = ({ busy, error, onCancel, saveText = 'Lưu và đăng' }) => (
  <div className="form-bar">
    {error && <p className="err" role="alert">{error}</p>}
    <div className="row wrap">
      <button className="btn big" disabled={busy}>{busy ? 'Đang lưu…' : saveText}</button>
      <button type="button" className="btn ghost" onClick={onCancel}>Hủy</button>
      {/* a link inside the form, so the unsaved-changes guard lets it through */}
      <a className="btn ghost" href="/xem-nhap" target="_blank" rel="noreferrer"><Eye size={18} aria-hidden="true" /> Xem trước</a>
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

// A picture where readers see it, with its controls on it.
export function CoverField({ url, onChange, onError, addText = '+ Thêm ảnh bìa', changeText = 'Đổi ảnh bìa', alt = 'Ảnh bìa' }) {
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
        <span>{busy ? 'Đang tải ảnh lên…' : addText}</span>
        {input}
      </label>
    );
  }
  return (
    <div className="cover-edit">
      <img src={url} alt={alt} />
      <div className="cover-tools">
        <label className="cover-btn"><Camera size={16} aria-hidden="true" /> {busy ? 'Đang tải…' : changeText}{input}</label>
        <button type="button" className="cover-btn" onClick={() => onChange('')}><X size={16} aria-hidden="true" /> Gỡ</button>
      </div>
    </div>
  );
}

// one numbered step of a form, so the order to fill it in is obvious
const Step = ({ n, title, hint, children }) => (
  <section className="step">
    <h3><span className="step-n" aria-hidden="true">{n}</span>{title}</h3>
    {hint && <p className="hint">{hint}</p>}
    {children}
  </section>
);

// "Đào tạo", "Đào tạo › Thông báo đào tạo", … in menu order: one list instead of two linked boxes
const sectionOptions = (cats) => topLevel(cats).flatMap((c) => [{ slug: c.slug, name: c.name }, ...childrenOf(cats, c.slug).map((k) => ({ slug: k.slug, name: `${c.name} › ${k.name}` }))]);

// readers see a short summary in lists; when none was written, the start of the text serves
const autoExcerpt = (post) => (post.excerpt.trim() ? post : { ...post, excerpt: plain(post.content).slice(0, 220) });

export function PostForm({ cats, initial, onSaved, onCancel }) {
  const empty = { title: '', excerpt: '', content: '', coverImage: '', category: '', isFeatured: false, pinned: false, pinnedUntil: '' };
  const { f, setF, set, error, setError, busy, submit, cancel } = useSave(
    { ...empty, ...initial, files: initial.files || [], author: initial.author ?? rememberedAuthor() },
    (post) => { rememberAuthor(post.author); return api.savePost(autoExcerpt(post)); },
    onSaved,
    onCancel
  );
  const [source, setSource] = useState(false); // the Markdown view, for whoever knows it
  useDraft('post', f);
  const field = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  return (
    <form className="simple-form" onSubmit={submit}>
      <h2>{f.id ? 'Sửa tin' : 'Đăng tin mới'}</h2>
      <Step n="1" title="Tiêu đề">
        <Grow className="studio-title" label="Tiêu đề" placeholder="Gõ tiêu đề tin ở đây" required oneLine value={f.title} onChange={field('title')} />
      </Step>
      <Step n="2" title="Ảnh bìa" hint="Ảnh lớn hiện đầu tin và ở trang chủ. Không bắt buộc.">
        <CoverField url={f.coverImage} onChange={field('coverImage')} onError={setError} />
      </Step>
      <Step n="3" title="Nội dung" hint="Gõ như soạn văn bản. Muốn thêm ảnh vào giữa bài, bấm “Chèn ảnh”.">
        <Body value={f.content} onChange={field('content')} alt={f.title} onError={setError} onCover={field('coverImage')} allowSource={source} />
      </Step>
      <Step n="4" title="Tin này thuộc mục nào?">
        <select className="big-select" aria-label="Thuộc mục" value={f.category} onChange={set('category')} required>
          <option value="" disabled>— Bấm để chọn mục —</option>
          {sectionOptions(cats).map((o) => <option key={o.slug} value={o.slug}>{o.name}</option>)}
        </select>
      </Step>
      <Step n="5" title="Hiện ở trang chủ" hint="Không bắt buộc.">
        <label className="check big"><input type="checkbox" checked={f.isFeatured} onChange={set('isFeatured')} /> Đưa lên khối tin nổi bật (ảnh lớn đầu trang chủ)</label>
        <label className="check big"><input type="checkbox" checked={f.pinned} onChange={set('pinned')} /> Ghim lên mục “Thông báo quan trọng”</label>
        {f.pinned && <label className="sub-field">Bỏ ghim sau ngày (để trống = ghim mãi)<input type="date" value={f.pinnedUntil} onChange={set('pinnedUntil')} /></label>}
      </Step>
      <details className="more-options">
        <summary>Tùy chọn thêm</summary>
        <label>Tóm tắt ngắn (để trống thì tự lấy đầu bài)<textarea rows="2" value={f.excerpt} onChange={set('excerpt')} /></label>
        <label>Tên người đăng (chỉ người quản trị thấy)<input value={f.author} onChange={set('author')} maxLength={80} /></label>
        <FilesField files={f.files} onChange={field('files')} onError={setError} />
        <label className="check"><input type="checkbox" checked={source} onChange={(e) => setSource(e.target.checked)} /> Hiện nút sửa mã Markdown (cho người rành kỹ thuật)</label>
      </details>
      <Actions busy={busy} error={error} onCancel={cancel} saveText={f.id ? 'Lưu thay đổi' : 'Đăng tin'} />
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
  const [source, setSource] = useState(false);
  useDraft('page', f);
  const field = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  return (
    <form className="simple-form" onSubmit={submit}>
      <h2>{f.slug ? `Sửa trang “${f.title}”` : 'Thêm trang mới'}</h2>
      <Step n="1" title="Tên trang">
        <Grow className="studio-title" label="Tên trang" placeholder="Ví dụ: Lịch sử hình thành" required oneLine value={f.title} onChange={field('title')} />
      </Step>
      <Step n="2" title="Nội dung" hint="Gõ như soạn văn bản. Muốn thêm ảnh, bấm “Chèn ảnh”.">
        <Body value={f.content} onChange={field('content')} alt={f.title} onError={setError} allowSource={source} />
      </Step>
      <Step n="3" title="Tệp đính kèm" hint="Ví dụ các biểu mẫu Word, PDF cho người xem tải về. Không bắt buộc.">
        <FilesField files={f.files} onChange={field('files')} onError={setError} />
      </Step>
      <Step n="4" title="Hiện trong menu nào?">
        <select className="big-select" aria-label="Hiện trong menu của mục" value={f.group} onChange={set('group')}>
          <option value="">Không hiện trong menu</option>
          {topLevel(cats).map((c) => <option key={c.slug} value={c.slug}>Menu “{c.name}”</option>)}
        </select>
      </Step>
      <details className="more-options">
        <summary>Tùy chọn thêm</summary>
        <label className="check"><input type="checkbox" checked={source} onChange={(e) => setSource(e.target.checked)} /> Hiện nút sửa mã Markdown (cho người rành kỹ thuật)</label>
      </details>
      <Actions busy={busy} error={error} onCancel={cancel} saveText="Lưu trang" />
    </form>
  );
}
