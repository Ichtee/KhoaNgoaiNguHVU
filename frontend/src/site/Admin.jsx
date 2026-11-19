import React, { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { api, fmtDate, getToken, setToken } from '../api';
import { PostForm, PageForm } from './AdminForms';
import { childrenOf, topLevel, treeSlugs } from './tree';
import { safeReturn } from './admin/links';
import { move } from './admin/order';

// a plain message, or { text, href } after a save so the admin can open what they just published
const Notice = ({ notice }) =>
  notice ? (
    <p className="ok" role="status">
      {notice.text || notice}
      {notice.href && <> <a href={notice.href} target="_blank" rel="noreferrer">Xem trên website →</a></>}
    </p>
  ) : null;

function Login({ onDone }) {
  const [f, setF] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try {
      setToken((await api.login(f.username, f.password)).token);
      onDone();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <form className="box form narrow" onSubmit={submit}>
      <h2>Đăng nhập quản trị</h2>
      <input aria-label="Tên đăng nhập" autoComplete="username" placeholder="Tên đăng nhập" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} required />
      <input aria-label="Mật khẩu" type="password" autoComplete="current-password" placeholder="Mật khẩu" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
      {error && <p className="err" role="alert">{error}</p>}
      <button className="btn">Đăng nhập</button>
    </form>
  );
}

// Posts of one big section (or of every section when there is no :slug), with sub-section filter and title search.
function PostsAdmin({ posts, cats, reload, guard }) {
  const { slug } = useParams();
  const [sub, setSub] = useState('');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null); // null = list, object = form
  const [notice, setNotice] = useState('');

  // a new section starts clean: no filter, no open form, no old message
  useEffect(() => { setSub(''); setQ(''); setEditing(null); setNotice(''); }, [slug]);

  const section = cats.find((c) => c.slug === slug);
  if (slug && cats.length && !section) return <p className="empty">Không có mục này.</p>;
  if (!posts) return <p className="empty">Đang tải…</p>;

  const nameOf = (s) => cats.find((c) => c.slug === s)?.name || s;
  const inSection = (s) => posts.filter((p) => treeSlugs(cats, s).includes(p.category));
  const kids = slug ? childrenOf(cats, slug) : [];
  const scope = slug ? (sub ? posts.filter((p) => p.category === sub) : inSection(slug)) : posts;
  const words = q.trim().toLowerCase();
  const list = words ? scope.filter((p) => p.title.toLowerCase().includes(words)) : scope;
  const target = sub || slug || '';

  if (editing) {
    return (
      <PostForm
        cats={cats}
        initial={editing}
        onCancel={() => setEditing(null)}
        onSaved={(saved) => { setEditing(null); setNotice({ text: `Đã lưu bài “${saved.title}”.`, href: `/bai-viet/${saved.slug}` }); reload(); }}
      />
    );
  }

  const remove = (p) => {
    if (window.confirm(`Xóa bài "${p.title}"? Không khôi phục được.`)) {
      guard(async () => { await api.deletePost(p.id); setNotice(`Đã xóa bài “${p.title}”.`); await reload(); });
    }
  };

  return (
    <div className="box">
      <div className="row between wrap">
        <h2>{section ? section.name : 'Tất cả bài viết'}</h2>
        <button className="btn" onClick={() => { setNotice(''); setEditing({ category: target }); }}>
          + Viết bài {target ? `trong “${nameOf(target)}”` : 'mới'}
        </button>
      </div>
      <Notice notice={notice} />

      {kids.length > 0 && (
        <div className="chips" role="group" aria-label="Lọc theo mục con">
          <button className={sub ? '' : 'on'} aria-pressed={!sub} onClick={() => setSub('')}>Tất cả ({inSection(slug).length})</button>
          {kids.map((k) => (
            <button key={k.slug} className={sub === k.slug ? 'on' : ''} aria-pressed={sub === k.slug} onClick={() => setSub(k.slug)}>
              {k.name} ({posts.filter((p) => p.category === k.slug).length})
            </button>
          ))}
        </div>
      )}

      <input className="search" type="search" placeholder="Tìm theo tiêu đề" aria-label="Tìm bài theo tiêu đề" value={q} onChange={(e) => setQ(e.target.value)} />

      {list.length === 0 ? (
        <p className="empty">{words ? 'Không có bài nào khớp.' : 'Chưa có bài nào trong mục này.'}</p>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Ngày</th><th>Tiêu đề</th>{!slug && <th>Mục lớn</th>}<th>Mục con</th><th>Người đăng</th><th /></tr>
            </thead>
            <tbody>
              {list.map((p) => {
                const c = cats.find((x) => x.slug === p.category);
                return (
                  <tr key={p.id}>
                    <td>{fmtDate(p.createdAt)}</td>
                    <td>
                      {p.title}
                      {p.isFeatured && <span className="tag">Nổi bật</span>}
                      {p.pinnedNow && <span className="tag">Đang ghim</span>}
                    </td>
                    {!slug && <td>{c?.parent ? nameOf(c.parent) : c?.name}</td>}
                    <td>{c?.parent ? c.name : '—'}</td>
                    <td>{p.author || '—'}</td>
                    <td className="actions">
                      <a href={`/bai-viet/${p.slug}`} target="_blank" rel="noreferrer">Xem</a>
                      <button onClick={() => { setNotice(''); setEditing(p); }}>Sửa</button>
                      <button onClick={() => remove(p)}>Xóa</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PagesAdmin({ cats, pages, reload, guard }) {
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');
  const nameOf = (s) => cats.find((c) => c.slug === s)?.name || s;

  if (editing) {
    return (
      <PageForm
        cats={cats}
        initial={editing}
        onCancel={() => setEditing(null)}
        onSaved={(saved) => { setEditing(null); setNotice({ text: `Đã lưu trang “${saved.title}”.`, href: `/trang/${saved.slug}` }); reload(); }}
      />
    );
  }

  const remove = (p) => {
    if (window.confirm(`Xóa trang "${p.title}"? Không khôi phục được.`)) {
      guard(async () => { await api.deletePage(p.slug); setNotice(`Đã xóa trang “${p.title}”.`); await reload(); });
    }
  };

  return (
    <div className="box">
      <div className="row between wrap">
        <h2>Trang cố định</h2>
        <button className="btn" onClick={() => { setNotice(''); setEditing({}); }}>+ Trang mới</button>
      </div>
      <p className="hint">Nội dung ít thay đổi như lịch sử, giới thiệu ngành, tuyển sinh. Trang hiện trong menu của mục đã chọn.</p>
      <Notice notice={notice} />
      <div className="table-wrap">
        <table className="admin-table">
          <thead><tr><th>Trang</th><th>Hiện trong menu của mục</th><th /></tr></thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.slug}>
                <td>{p.title}</td>
                <td>{p.group ? nameOf(p.group) : '—'}</td>
                <td className="actions">
                  {(() => {
                    // ↑↓ among the pages listed in the same section's menu
                    const group = pages.filter((x) => x.group === p.group).map((x) => x.slug);
                    const i = group.indexOf(p.slug);
                    const shift = (dir) => { const next = move(group, i, dir); if (next) guard(async () => { await api.reorderPages(next); await reload(); }); };
                    return p.group && group.length > 1 && (
                      <>
                        <button aria-label={`Đưa ${p.title} lên`} disabled={i === 0} onClick={() => shift(-1)}>↑</button>
                        <button aria-label={`Đưa ${p.title} xuống`} disabled={i === group.length - 1} onClick={() => shift(1)}>↓</button>
                      </>
                    );
                  })()}
                  <a href={`/trang/${p.slug}`} target="_blank" rel="noreferrer">Xem</a>
                  <button onClick={() => guard(async () => { setNotice(''); setEditing(await api.page(p.slug)); })}>Sửa</button>
                  {p.slug !== 'gioi-thieu' && <button onClick={() => remove(p)}>Xóa</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const SETTING_FIELDS = [
  ['name', 'Tên khoa'],
  ['university', 'Tên trường'],
  ['tagline', 'Dòng mô tả ngắn (trang chủ và chân trang)'],
  ['address', 'Địa chỉ'],
  ['phone', 'Điện thoại'],
  ['email', 'Email'],
  ['facebook', 'Liên kết Facebook (bắt đầu bằng https://)'],
  ['website', 'Website của trường (bắt đầu bằng https://)']
];

const IMAGE_FIELDS = [
  ['logo', 'Logo (đầu trang, trang chủ, biểu tượng tab)'],
  ['heroImage', 'Ảnh nền khối đầu trang chủ (để trống = nền xanh)']
];

// paste an image address, or upload one from this computer
function ImageField({ label, value, onChange, onError }) {
  const upload = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      onChange((await api.upload(file)).url);
      onError('');
    } catch (err) {
      onError(err.message);
    }
  };
  return (
    <div className="field">
      <span className="lbl">{label}</span>
      <input aria-label={label} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="https://… hoặc chọn ảnh từ máy" />
      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" aria-label={`Tải ảnh lên: ${label}`} onChange={upload} />
      {value && <img className="preview" src={value} alt="" />}
    </div>
  );
}

function SettingsForm({ site, reload }) {
  const [f, setF] = useState(site);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [params] = useSearchParams();
  const navigate = useNavigate();
  useEffect(() => setF(site), [site]); // the site loads after the first render when the admin is opened directly
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      await api.saveSettings(f);
      await reload();
      if (params.get('ve')) return navigate(safeReturn(params.get('ve'))); // opened from the public site: show the change there
      setMsg('Đã lưu.');
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <form className="box form" onSubmit={submit}>
      <h2>Thông tin khoa</h2>
      <p className="hint">Hiện ở đầu trang, trang chủ, mục Liên hệ và chân trang.</p>
      {SETTING_FIELDS.map(([key, label]) => (
        <label key={key}>{label}
          <input value={f[key] || ''} onChange={(e) => setF({ ...f, [key]: e.target.value })} required={key === 'name'} />
        </label>
      ))}
      {IMAGE_FIELDS.map(([key, label]) => (
        <ImageField key={key} label={label} value={f[key]} onChange={(v) => setF((s) => ({ ...s, [key]: v }))} onError={setError} />
      ))}
      {error && <p className="err" role="alert">{error}</p>}
      <div className="row"><button className="btn">Lưu</button><span className="ok-text" role="status">{msg}</span></div>
    </form>
  );
}

function Categories({ cats, reload, guard }) {
  const [name, setName] = useState('');
  const [parent, setParent] = useState('');
  const add = (e) => {
    e.preventDefault();
    guard(async () => {
      await api.addCategory(name.trim(), parent);
      setName('');
      await reload();
    });
  };
  const rename = (c) => {
    const next = window.prompt('Tên mới của chuyên mục', c.name);
    if (next?.trim()) guard(async () => { await api.updateCategory(c.slug, { name: next.trim() }); await reload(); });
  };
  const remove = (c) => {
    if (window.confirm(`Xóa chuyên mục "${c.name}"?`)) guard(async () => { await api.deleteCategory(c.slug); await reload(); });
  };
  const describe = (c) => {
    const next = window.prompt(`Mô tả ngắn của mục "${c.name}" (hiện dưới tên mục; để trống để bỏ):`, c.description || '');
    if (next !== null) guard(async () => { await api.updateCategory(c.slug, { name: c.name, description: next.trim() }); await reload(); });
  };
  // ↑↓ within the same level: top-level sections among themselves, sub-sections within their section
  const siblingsOf = (c) => (c.parent ? childrenOf(cats, c.parent) : topLevel(cats));
  const shift = (c, dir) => {
    const group = siblingsOf(c).map((x) => x.slug);
    const next = move(group, group.indexOf(c.slug), dir);
    if (next) guard(async () => { await api.reorderCategories(next); await reload(); });
  };
  return (
    <div className="box">
      <h2>Chuyên mục</h2>
      <form className="row wrap" onSubmit={add}>
        <input className="grow" aria-label="Tên chuyên mục mới" placeholder="Tên chuyên mục mới" value={name} onChange={(e) => setName(e.target.value)} required />
        <select aria-label="Thuộc mục lớn" value={parent} onChange={(e) => setParent(e.target.value)}>
          <option value="">Đây là mục lớn</option>
          {topLevel(cats).map((c) => <option key={c.slug} value={c.slug}>Mục con của: {c.name}</option>)}
        </select>
        <button className="btn">Thêm</button>
      </form>
      <div className="table-wrap">
        <table className="admin-table">
          <thead><tr><th>Mục lớn</th><th>Mục con</th><th /></tr></thead>
          <tbody>
            {topLevel(cats).flatMap((c) => [c, ...childrenOf(cats, c.slug)]).map((c) => (
              <tr key={c.slug}>
                <td>{!c.parent && <><strong>{c.name}</strong>{c.description && <div className="hint">{c.description}</div>}</>}</td>
                <td>{c.parent && c.name}</td>
                <td className="actions">
                  <button aria-label={`Đưa ${c.name} lên`} disabled={siblingsOf(c)[0]?.slug === c.slug} onClick={() => shift(c, -1)}>↑</button>
                  <button aria-label={`Đưa ${c.name} xuống`} disabled={siblingsOf(c).at(-1)?.slug === c.slug} onClick={() => shift(c, 1)}>↓</button>
                  <button onClick={() => rename(c)}>Đổi tên</button>
                  {!c.parent && <button onClick={() => describe(c)}>Mô tả</button>}
                  <button onClick={() => remove(c)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Opened from a ✎ on the public site (/quan-tri/bai/<slug>, /bai-moi?muc=…): the editor alone,
// and back to the page the admin came from (?ve=…) after saving or cancelling.
function useBack(fallback) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const ve = params.get('ve');
  return { params, back: (to) => navigate(ve ? safeReturn(ve) : to || fallback) };
}

function EditPostRoute({ cats, after }) {
  const { slug } = useParams();
  const { params, back } = useBack('/quan-tri');
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!slug) setPost({ category: params.get('muc') || '' });
    else api.post(slug).then(setPost).catch((e) => setError(e.message));
  }, [slug]);
  if (error) return <p className="empty">{error}</p>;
  if (!post) return <p className="empty">Đang tải…</p>;
  return <PostForm key={post.id || 'new'} cats={cats} initial={post} onCancel={() => back()} onSaved={(saved) => { after(); back(`/bai-viet/${saved.slug}`); }} />;
}

function EditPageRoute({ cats, after }) {
  const { slug } = useParams();
  const { params, back } = useBack('/quan-tri/trang');
  const [page, setPage] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!slug) setPage({ group: params.get('muc') || '' });
    else api.page(slug).then(setPage).catch((e) => setError(e.message));
  }, [slug]);
  if (error) return <p className="empty">{error}</p>;
  if (!page) return <p className="empty">Đang tải…</p>;
  return <PageForm key={page.slug || 'new'} cats={cats} initial={page} onCancel={() => back()} onSaved={(saved) => { after(); back(`/trang/${saved.slug}`); }} />;
}

// "← Quay lại trang đang xem" on admin screens opened from the public site
function BackToSite() {
  const [params] = useSearchParams();
  const ve = params.get('ve');
  return ve ? <p className="back-to-site"><Link to={safeReturn(ve)}>← Quay lại trang đang xem</Link></p> : null;
}

export default function Admin() {
  const { cats, pages, site, reload, refreshAdmin } = useOutletContext();
  const [authed, setAuthed] = useState(!!getToken());
  const [posts, setPosts] = useState(null);

  const loadPosts = useCallback(() => api.posts().then(setPosts), []);
  useEffect(() => { if (authed) loadPosts(); }, [authed, loadPosts]);
  // a token kept from an earlier visit may be dead by now: find out when the admin opens, not when the first save fails
  useEffect(() => {
    if (!authed) return;
    api.session().catch((err) => {
      if (err.message.includes('đăng nhập')) { setToken(null); setAuthed(false); }
    });
  }, [authed]);

  if (!authed) return <Login onDone={() => { setAuthed(true); refreshAdmin?.(); }} />;

  // tell the server first (it forgets the token, so a copy of it stops working), then forget it here; the request reads the token before it is cleared
  const logout = () => { api.logout().catch(() => {}); setToken(null); setAuthed(false); refreshAdmin?.(); };
  const after = () => { loadPosts(); reload(); };
  // runs an admin action; an expired token sends the admin back to the login form
  const guard = async (fn) => {
    try {
      await fn();
    } catch (err) {
      if (err.message.includes('đăng nhập')) logout();
      else alert(err.message);
    }
  };
  const count = (slug) => posts?.filter((p) => treeSlugs(cats, slug).includes(p.category)).length;
  const postsProps = { posts, cats, reload: loadPosts, guard };

  return (
    <div className="admin">
      <nav className="admin-nav" aria-label="Quản trị">
        <p className="admin-nav-h">Bài viết theo mục</p>
        <NavLink to="/quan-tri" end>Tất cả bài viết <span>{posts?.length}</span></NavLink>
        {topLevel(cats).map((c) => (
          <NavLink key={c.slug} to={`/quan-tri/muc/${c.slug}`}>{c.name} <span>{count(c.slug)}</span></NavLink>
        ))}
        <p className="admin-nav-h">Nội dung khác</p>
        <NavLink to="/quan-tri/trang">Trang cố định</NavLink>
        <NavLink to="/quan-tri/chuyen-muc">Chuyên mục</NavLink>
        <NavLink to="/quan-tri/thong-tin">Thông tin khoa</NavLink>
        <a className="admin-site" href="/" target="_blank" rel="noreferrer"><ExternalLink size={16} /> Xem website</a>
        <button className="linkbtn logout" onClick={logout}>Đăng xuất</button>
      </nav>

      <div className="admin-main">
        <Routes>
          <Route index element={<PostsAdmin {...postsProps} />} />
          <Route path="muc/:slug" element={<PostsAdmin {...postsProps} />} />
          <Route path="trang" element={<PagesAdmin cats={cats} pages={pages} reload={reload} guard={guard} />} />
          <Route path="bai/:slug" element={<EditPostRoute cats={cats} after={after} />} />
          <Route path="bai-moi" element={<EditPostRoute cats={cats} after={after} />} />
          <Route path="sua-trang/:slug" element={<EditPageRoute cats={cats} after={after} />} />
          <Route path="trang-moi" element={<EditPageRoute cats={cats} after={after} />} />
          <Route path="chuyen-muc" element={<><BackToSite /><Categories cats={cats} pages={pages} reload={reload} guard={guard} /></>} />
          <Route path="thong-tin" element={<><BackToSite /><SettingsForm site={site} reload={reload} /></>} />
          <Route path="*" element={<p className="empty">Không có trang quản trị này.</p>} />
        </Routes>
      </div>
    </div>
  );
}
