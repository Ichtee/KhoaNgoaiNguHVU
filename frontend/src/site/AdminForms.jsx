import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { api } from '../api';
import { childrenOf, topLevel } from './tree';

const DOCS = 'application/pdf,.doc,.docx,.xls,.xlsx';
const IMAGES = 'image/jpeg,image/png,image/webp,image/gif';

function Editor({ label, value, onChange }) {
  return (
    <div className="field">
      <span className="lbl">{label}</span>
      <textarea rows="14" aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} />
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

// Pictures live in the text as ![alt](url), optionally followed by an *italic caption* line.
// The grid below edits those in place, so the text stays the single source of truth.
const IMG = /!\[([^\]]*)\]\(([^)\s]+)\)(\n\*[^*\n]+\*)?/g;
export const imagesIn = (text) => [...text.matchAll(IMG)].map((m) => ({ url: m[2], whole: m[0], at: m.index }));
const tidy = (text) => text.replace(/## Hình ảnh\s*(?=\*Nguồn|##|$)/, '').replace(/\n{3,}/g, '\n\n').trim();
export function removeImage(text, k) {
  const im = imagesIn(text)[k];
  return tidy(text.slice(0, im.at) + text.slice(im.at + im.whole.length));
}
export function swapImages(text, a, b) {
  const all = imagesIn(text);
  const [x, y] = a < b ? [all[a], all[b]] : [all[b], all[a]];
  return text.slice(0, x.at) + y.whole + text.slice(x.at + x.whole.length, y.at) + x.whole + text.slice(y.at + y.whole.length);
}
// new pictures go after the existing ones, above a closing "*Nguồn: …*" line if there is one
export function addImages(text, urls, alt) {
  const block = urls.map((u) => `![${alt.replace(/[[\]]/g, '')}](${u})`).join('\n\n');
  const source = /\n*\*Nguồn:[^\n]*\*\s*$/.exec(text);
  return source ? `${text.slice(0, source.index)}\n\n${block}\n\n${text.slice(source.index).trim()}` : `${text.trim()}\n\n${block}`.trim();
}

function ImagesField({ content, editContent, cover, onCover, alt, onError }) {
  const [busy, setBusy] = useState(false);
  const imgs = imagesIn(content);
  const add = async (e) => {
    const picked = [...e.target.files];
    e.target.value = '';
    if (!picked.length) return;
    setBusy(true);
    const urls = [];
    try {
      for (const file of picked) urls.push((await api.upload(file)).url);
      onError('');
    } catch (err) {
      onError(err.message);
    }
    if (urls.length) editContent((c) => addImages(c, urls, alt)); // keep the ones that uploaded even if a later one failed
    setBusy(false);
  };
  return (
    <div className="field">
      <span className="lbl">Ảnh trong bài ({imgs.length})</span>
      {imgs.length > 0 && (
        <ul className="imgs">
          {imgs.map((im, k) => (
            <li key={`${k}-${im.url}`}>
              <img src={im.url} alt={`Ảnh ${k + 1}`} loading="lazy" />
              {onCover && cover === im.url && <span className="badge">Ảnh bìa</span>}
              <div className="tools">
                <button type="button" aria-label={`Đưa ảnh ${k + 1} lên trước`} disabled={k === 0} onClick={() => editContent((c) => swapImages(c, k, k - 1))}>←</button>
                <button type="button" aria-label={`Đưa ảnh ${k + 1} ra sau`} disabled={k === imgs.length - 1} onClick={() => editContent((c) => swapImages(c, k, k + 1))}>→</button>
                {onCover && cover !== im.url && <button type="button" onClick={() => onCover(im.url)}>Làm ảnh bìa</button>}
                <button type="button" className="danger" aria-label={`Gỡ ảnh ${k + 1}`} onClick={() => editContent((c) => removeImage(c, k))}>Gỡ</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <label className="addimg">{busy ? 'Đang tải ảnh lên…' : '+ Thêm ảnh (chọn được nhiều ảnh)'}
        <input type="file" multiple accept={IMAGES} onChange={add} disabled={busy} />
      </label>
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
      <label>{f.coverImage ? 'Đổi ảnh bìa' : 'Ảnh bìa'} (JPG, PNG, WEBP, GIF)<input type="file" accept={IMAGES} onChange={uploadCover} /></label>
      {f.coverImage && (
        <div className="row">
          <img className="preview" src={f.coverImage} alt="Ảnh bìa đã chọn" />
          <button type="button" className="linkbtn" onClick={() => setF({ ...f, coverImage: '' })}>Gỡ ảnh bìa</button>
        </div>
      )}
      <ImagesField
        content={f.content}
        editContent={(fn) => setF((s) => ({ ...s, content: fn(s.content) }))}
        cover={f.coverImage}
        onCover={(url) => setF((s) => ({ ...s, coverImage: url }))}
        alt={f.title}
        onError={setError}
      />
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
  useDraft('page', f);

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
      <ImagesField content={f.content} editContent={(fn) => setF((s) => ({ ...s, content: fn(s.content) }))} alt={f.title} onError={setError} />
      <FilesField files={f.files} onChange={(files) => setF((s) => ({ ...s, files }))} onError={setError} />
      <Actions busy={busy} error={error} onCancel={cancel} />
    </form>
  );
}
