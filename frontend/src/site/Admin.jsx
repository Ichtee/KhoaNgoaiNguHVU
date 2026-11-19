import React, { useCallback, useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, FileText, Home, LogOut, Newspaper, PenLine, Phone, Settings2 } from 'lucide-react';
import { api, fmtDate, setToken } from '../api';
import { CoverField, PostForm, PageForm } from './AdminForms';
import { Cover } from './parts';
import { childrenOf, topLevel } from './tree';
import { useAdmin } from './admin/OnSite';
import { move } from './admin/order';

// The admin, for people who are not technical: a dashboard of plain tasks, one screen per task,
// buttons that say what they do. Layout has already confirmed the session before any of this renders.

const EXPIRED = 'Phiên đăng nhập đã hết, hãy đăng nhập lại.';

// runs a save or delete; an ended session sends the admin to the login form, anything else is shown
function useAction() {
  const { signOut } = useAdmin();
  return async (fn) => {
    try {
      await fn();
      return true;
    } catch (err) {
      if (/đăng nhập/i.test(err.message)) { alert(EXPIRED); signOut(); } else alert(err.message);
      return false;
    }
  };
}

// back where the admin came from inside the admin, or to the dashboard when the page was opened directly
function useGoBack() {
  const navigate = useNavigate();
  return (fallback = '/quan-tri') => (window.history.state?.idx > 0 ? navigate(-1) : navigate(fallback));
}

// also shown by Layout whenever /quan-tri is opened without a valid session
export function Login({ onDone }) {
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
      <button className="btn big">Đăng nhập</button>
    </form>
  );
}

// ---- dashboard

const TASKS = [
  ['tin/moi', PenLine, 'Đăng tin mới', 'Viết và đăng một tin, thông báo hay bài hoạt động'],
  ['tin', Newspaper, 'Sửa hoặc xóa tin đã đăng', 'Tìm lại tin cũ để sửa chữ, đổi ảnh hoặc xóa'],
  ['trang-chu', Home, 'Trang chủ', 'Đổi ảnh lớn đầu trang, chọn tin nổi bật và tin ghim'],
  ['trang', FileText, 'Các trang thông tin', 'Giới thiệu, lịch sử, tuyển sinh, biểu mẫu…'],
  ['lien-he', Phone, 'Thông tin liên hệ & logo', 'Địa chỉ, số điện thoại, email, Facebook, logo']
];

function Dashboard({ posts, pages }) {
  const counts = { tin: posts && `${posts.length} tin`, trang: `${pages.length} trang` };
  return (
    <>
      <h1 className="desk-hello">Xin chào! Hôm nay bạn muốn làm gì?</h1>
      <ul className="tasks">
        {TASKS.map(([to, Icon, title, hint]) => (
          <li key={to}>
            <Link className="task" to={`/quan-tri/${to}`}>
              <span className="task-icon"><Icon size={30} aria-hidden="true" /></span>
              <strong>{title}</strong>
              <span>{hint}</span>
              {counts[to] && <small>{counts[to]}</small>}
            </Link>
          </li>
        ))}
      </ul>
      <p className="advanced-link"><Link to="/quan-tri/nang-cao"><Settings2 size={16} aria-hidden="true" /> Cài đặt nâng cao: menu, chuyên mục và thứ tự trang</Link></p>
    </>
  );
}

// ---- posts

const PAGE_SIZE = 20;
const fold = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

function PostsScreen({ posts, cats, loadPosts }) {
  const act = useAction();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [shown, setShown] = useState(PAGE_SIZE);
  if (!posts) return <p className="empty">Đang tải…</p>;

  const nameOf = (slug) => {
    const c = cats.find((x) => x.slug === slug);
    const parent = c?.parent && cats.find((x) => x.slug === c.parent);
    return c ? (parent ? `${parent.name} › ${c.name}` : c.name) : '';
  };
  const inSection = (p) => !cat || p.category === cat || cats.find((c) => c.slug === p.category)?.parent === cat;
  const words = fold(q).split(/\s+/).filter(Boolean);
  const list = posts.filter((p) => inSection(p) && words.every((w) => fold(p.title).includes(w)));

  const remove = (p) => {
    if (window.confirm(`Xóa tin “${p.title}”?\n\nTin sẽ biến mất khỏi trang web và không lấy lại được.`)) act(async () => { await api.deletePost(p.id); await loadPosts(); });
  };

  return (
    <>
      <div className="screen-head">
        <h1>Tin đã đăng</h1>
        <Link className="btn big" to="/quan-tri/tin/moi">+ Đăng tin mới</Link>
      </div>
      <div className="finder">
        <input type="search" className="big-input" placeholder="Tìm tin theo tiêu đề…" aria-label="Tìm tin theo tiêu đề" value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE_SIZE); }} />
        <select className="big-select" aria-label="Lọc theo mục" value={cat} onChange={(e) => { setCat(e.target.value); setShown(PAGE_SIZE); }}>
          <option value="">Tất cả các mục</option>
          {topLevel(cats).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      </div>
      <p className="hint" role="status">{list.length} tin</p>
      {list.length === 0 && <p className="empty">Không tìm thấy tin nào.</p>}
      <ul className="item-list">
        {list.slice(0, shown).map((p) => (
          <li key={p.id} className="item-row">
            <Cover post={p} />
            <div className="item-main">
              <strong>{p.title}</strong>
              <span className="item-meta">
                {fmtDate(p.createdAt)} · {nameOf(p.category)}
                {p.isFeatured && <span className="tag">Tin nổi bật</span>}
                {p.pinnedNow && <span className="tag">Đang ghim</span>}
              </span>
            </div>
            <div className="item-actions">
              <Link className="btn" to={`/quan-tri/tin/${p.slug}`}>Sửa</Link>
              <a className="btn ghost" href={`/bai-viet/${p.slug}`} target="_blank" rel="noreferrer">Xem</a>
              <button type="button" className="btn ghost danger" onClick={() => remove(p)}>Xóa</button>
            </div>
          </li>
        ))}
      </ul>
      {list.length > shown && <button type="button" className="btn ghost wide" onClick={() => setShown(shown + PAGE_SIZE)}>Xem thêm tin cũ hơn</button>}
    </>
  );
}

function PostEditor({ cats, after, setNotice }) {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const goBack = useGoBack();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!slug) setPost({ category: params.get('muc') || '' });
    else api.post(slug).then(setPost).catch((e) => setError(e.message));
  }, [slug]);
  if (error) return <p className="empty">{error}</p>;
  if (!post) return <p className="empty">Đang tải…</p>;
  return (
    <PostForm
      key={post.id || 'new'}
      cats={cats}
      initial={post}
      onCancel={() => goBack('/quan-tri/tin')}
      onSaved={(saved) => {
        after();
        setNotice({ text: post.id ? 'Đã lưu thay đổi.' : 'Đã đăng! Tin đã hiện trên trang web.', href: `/bai-viet/${saved.slug}`, at: '/quan-tri/tin' });
        navigate('/quan-tri/tin');
      }}
    />
  );
}

// ---- home page: big picture, featured and pinned

const MAX_FEATURED = 5;

function HomeScreen({ site, reload, posts, loadPosts }) {
  const act = useAction();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  if (!posts) return <p className="empty">Đang tải…</p>;

  // tick boxes for the newest 40 posts, with every post already featured or pinned on top so it can be unticked
  const marked = posts.filter((p) => p.isFeatured || p.pinned);
  const list = [...marked, ...posts.filter((p) => !p.isFeatured && !p.pinned)].slice(0, Math.max(40, marked.length));
  const featured = posts.filter((p) => p.isFeatured).length;

  const saveHero = (url) => act(async () => { await api.saveSettings({ ...site, heroImage: url }); await reload(); });
  const toggle = async (p, key) => {
    setBusy(p.id + key);
    await act(async () => { await api.savePost({ ...p, [key]: !p[key] }); await loadPosts(); });
    setBusy('');
  };

  return (
    <>
      <div className="screen-head"><h1>Trang chủ</h1><a className="btn ghost" href="/" target="_blank" rel="noreferrer"><ExternalLink size={16} aria-hidden="true" /> Xem trang chủ</a></div>

      <section className="panel">
        <h2>Ảnh lớn đầu trang chủ</h2>
        <p className="hint">Nên chọn ảnh ngang, rõ người, khổ rộng. Ảnh được làm tối bên trái để chữ dễ đọc.</p>
        <CoverField url={site.heroImage} onChange={saveHero} onError={setError} addText="+ Chọn ảnh lớn cho trang chủ" changeText="Đổi ảnh" alt="Ảnh lớn đầu trang chủ" />
        {error && <p className="err" role="alert">{error}</p>}
      </section>

      <section className="panel">
        <h2>Tin hiện ở trang chủ</h2>
        <p className="hint">
          Tích ô <b>“Tin nổi bật”</b> để tin hiện ảnh lớn ở khối trình chiếu (tối đa {MAX_FEATURED} tin, đang chọn {featured}).
          Tích ô <b>“Ghim”</b> để tin hiện ở mục “Thông báo quan trọng”.
        </p>
        {featured > MAX_FEATURED && <p className="warn">Đang chọn {featured} tin nổi bật, nhưng trang chủ chỉ hiện {MAX_FEATURED} tin mới nhất. Hãy bỏ tích bớt các tin cũ.</p>}
        <ul className="item-list">
          {list.map((p) => (
            <li key={p.id} className="item-row">
              <Cover post={p} />
              <div className="item-main">
                <strong>{p.title}</strong>
                <span className="item-meta">{fmtDate(p.createdAt)}</span>
              </div>
              <div className="item-actions">
                <label className="check big"><input type="checkbox" checked={!!p.isFeatured} disabled={busy !== '' || (!p.isFeatured && featured >= MAX_FEATURED)} onChange={() => toggle(p, 'isFeatured')} /> Tin nổi bật</label>
                <label className="check big"><input type="checkbox" checked={!!p.pinned} disabled={busy !== ''} onChange={() => toggle(p, 'pinned')} /> Ghim</label>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

// ---- fixed pages

function PagesScreen({ pages, cats, reload }) {
  const act = useAction();
  const nameOf = (s) => cats.find((c) => c.slug === s)?.name;
  const remove = (p) => {
    if (window.confirm(`Xóa trang “${p.title}”?\n\nTrang sẽ biến mất khỏi trang web và không lấy lại được.`)) act(async () => { await api.deletePage(p.slug); await reload(); });
  };
  return (
    <>
      <div className="screen-head">
        <h1>Các trang thông tin</h1>
        <Link className="btn big" to="/quan-tri/trang/moi">+ Thêm trang mới</Link>
      </div>
      <p className="hint">Các trang ít thay đổi như giới thiệu, lịch sử, ngành đào tạo, tuyển sinh, biểu mẫu.</p>
      <ul className="item-list">
        {pages.map((p) => (
          <li key={p.slug} className="item-row no-pic">
            <div className="item-main">
              <strong>{p.title}</strong>
              <span className="item-meta">{p.group ? `Trong menu “${nameOf(p.group)}”` : 'Không có trong menu'}</span>
            </div>
            <div className="item-actions">
              <Link className="btn" to={`/quan-tri/trang/${p.slug}`}>Sửa</Link>
              <a className="btn ghost" href={`/trang/${p.slug}`} target="_blank" rel="noreferrer">Xem</a>
              {p.slug !== 'gioi-thieu' && <button type="button" className="btn ghost danger" onClick={() => remove(p)}>Xóa</button>}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function PageEditor({ cats, after, setNotice }) {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const goBack = useGoBack();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!slug) setPage({ group: params.get('muc') || '' });
    else api.page(slug).then(setPage).catch((e) => setError(e.message));
  }, [slug]);
  if (error) return <p className="empty">{error}</p>;
  if (!page) return <p className="empty">Đang tải…</p>;
  return (
    <PageForm
      key={page.slug || 'new'}
      cats={cats}
      initial={page}
      onCancel={() => goBack('/quan-tri/trang')}
      onSaved={(saved) => {
        after();
        setNotice({ text: 'Đã lưu trang.', href: `/trang/${saved.slug}`, at: '/quan-tri/trang' });
        navigate('/quan-tri/trang');
      }}
    />
  );
}

// ---- contact details and logo

const SETTING_FIELDS = [
  ['name', 'Tên khoa'],
  ['university', 'Tên trường'],
  ['tagline', 'Dòng giới thiệu ngắn (hiện dưới tên khoa ở trang chủ)'],
  ['address', 'Địa chỉ'],
  ['phone', 'Số điện thoại'],
  ['email', 'Email'],
  ['facebook', 'Địa chỉ trang Facebook (dán từ trình duyệt, bắt đầu bằng https://)'],
  ['website', 'Địa chỉ website của trường (bắt đầu bằng https://)']
];

function SettingsScreen({ site, reload }) {
  const [f, setF] = useState(site);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  useEffect(() => setF(site), [site]); // the site loads after the first render when the admin is opened directly
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      await api.saveSettings(f);
      await reload();
      setMsg('Đã lưu. Thông tin mới đã hiện trên trang web.');
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <form className="simple-form" onSubmit={submit}>
      <h1>Thông tin liên hệ & logo</h1>
      <p className="hint">Hiện ở đầu trang, trang chủ, mục Liên hệ và cuối mỗi trang.</p>
      <section className="step">
        <h3>Logo</h3>
        <CoverField url={f.logo} onChange={(v) => setF((s) => ({ ...s, logo: v }))} onError={setError} addText="+ Chọn logo" changeText="Đổi logo" alt="Logo" />
      </section>
      {SETTING_FIELDS.map(([key, label]) => (
        <label key={key} className="big-label">{label}
          <input className="big-input" value={f[key] || ''} onChange={(e) => setF({ ...f, [key]: e.target.value })} required={key === 'name'} />
        </label>
      ))}
      <div className="form-bar">
        {error && <p className="err" role="alert">{error}</p>}
        {msg && <p className="ok" role="status">{msg}</p>}
        <button className="btn big">Lưu thông tin</button>
      </div>
    </form>
  );
}

// ---- advanced: menu sections and the order of fixed pages

function Advanced({ cats, pages, reload }) {
  const act = useAction();
  const [name, setName] = useState('');
  const [parent, setParent] = useState('');
  const add = (e) => {
    e.preventDefault();
    act(async () => { await api.addCategory(name.trim(), parent); setName(''); await reload(); });
  };
  const rename = (c) => {
    const next = window.prompt('Tên mới của mục', c.name);
    if (next?.trim()) act(async () => { await api.updateCategory(c.slug, { name: next.trim() }); await reload(); });
  };
  const describe = (c) => {
    const next = window.prompt(`Dòng mô tả ngắn của mục “${c.name}” (hiện dưới tên mục; để trống để bỏ):`, c.description || '');
    if (next !== null) act(async () => { await api.updateCategory(c.slug, { name: c.name, description: next.trim() }); await reload(); });
  };
  const remove = (c) => {
    if (window.confirm(`Xóa mục “${c.name}”?`)) act(async () => { await api.deleteCategory(c.slug); await reload(); });
  };
  const siblingsOf = (c) => (c.parent ? childrenOf(cats, c.parent) : topLevel(cats));
  const shiftCat = (c, dir) => {
    const group = siblingsOf(c).map((x) => x.slug);
    const next = move(group, group.indexOf(c.slug), dir);
    if (next) act(async () => { await api.reorderCategories(next); await reload(); });
  };
  const shiftPage = (p, dir) => {
    const group = pages.filter((x) => x.group === p.group).map((x) => x.slug);
    const next = move(group, group.indexOf(p.slug), dir);
    if (next) act(async () => { await api.reorderPages(next); await reload(); });
  };
  const first = (list, item) => list[0]?.slug === item.slug;
  const last = (list, item) => list.at(-1)?.slug === item.slug;

  return (
    <>
      <div className="screen-head"><h1>Cài đặt nâng cao</h1></div>

      <section className="panel">
        <h2>Menu và chuyên mục</h2>
        <p className="hint">Mục lớn là các mục trên thanh menu; mục con nằm trong mục lớn. “Lên”, “Xuống” đổi thứ tự trên menu.</p>
        <form className="row wrap" onSubmit={add}>
          <input className="big-input grow" aria-label="Tên mục mới" placeholder="Tên mục mới" value={name} onChange={(e) => setName(e.target.value)} required />
          <select className="big-select" aria-label="Đặt ở đâu" value={parent} onChange={(e) => setParent(e.target.value)}>
            <option value="">Là mục lớn trên menu</option>
            {topLevel(cats).map((c) => <option key={c.slug} value={c.slug}>Là mục con của “{c.name}”</option>)}
          </select>
          <button className="btn big">Thêm mục</button>
        </form>
        <ul className="item-list">
          {topLevel(cats).flatMap((c) => [c, ...childrenOf(cats, c.slug)]).map((c) => (
            <li key={c.slug} className={`item-row no-pic${c.parent ? ' child' : ''}`}>
              <div className="item-main">
                <strong>{c.parent ? `› ${c.name}` : c.name}</strong>
                {c.description && <span className="item-meta">{c.description}</span>}
              </div>
              <div className="item-actions">
                <button type="button" className="btn ghost" disabled={first(siblingsOf(c), c)} onClick={() => shiftCat(c, -1)}>Lên</button>
                <button type="button" className="btn ghost" disabled={last(siblingsOf(c), c)} onClick={() => shiftCat(c, 1)}>Xuống</button>
                <button type="button" className="btn ghost" onClick={() => rename(c)}>Đổi tên</button>
                {!c.parent && <button type="button" className="btn ghost" onClick={() => describe(c)}>Mô tả</button>}
                <button type="button" className="btn ghost danger" onClick={() => remove(c)}>Xóa</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Thứ tự các trang trong menu</h2>
        {topLevel(cats).map((c) => {
          const group = pages.filter((p) => p.group === c.slug);
          if (group.length < 2) return null;
          return (
            <div key={c.slug} className="order-group">
              <h3>Menu “{c.name}”</h3>
              <ul className="item-list">
                {group.map((p) => (
                  <li key={p.slug} className="item-row no-pic">
                    <div className="item-main"><strong>{p.title}</strong></div>
                    <div className="item-actions">
                      <button type="button" className="btn ghost" disabled={first(group, p)} onClick={() => shiftPage(p, -1)}>Lên</button>
                      <button type="button" className="btn ghost" disabled={last(group, p)} onClick={() => shiftPage(p, 1)}>Xuống</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </>
  );
}

// ---- the shell

export default function Admin() {
  const { cats, pages, site, reload } = useOutletContext();
  const { signOut } = useAdmin();
  const { pathname } = useLocation();
  const [posts, setPosts] = useState(null);
  const [notice, setNotice] = useState(null); // { text, href, at }: shown once, on the screen named by `at`

  const loadPosts = useCallback(() => api.posts().then(setPosts), []);
  useEffect(() => { loadPosts(); }, [loadPosts]);
  const after = () => { loadPosts(); reload(); };
  const atHome = pathname === '/quan-tri' || pathname === '/quan-tri/';
  const shared = { cats, pages, site, reload, posts, loadPosts, after, setNotice };

  return (
    <div className="desk">
      <div className="desk-top">
        {atHome ? <span className="desk-title">Khu quản trị</span> : <Link className="btn ghost" to="/quan-tri"><ArrowLeft size={18} aria-hidden="true" /> Về bảng điều khiển</Link>}
        <span className="desk-actions">
          <a className="btn ghost" href="/" target="_blank" rel="noreferrer"><ExternalLink size={16} aria-hidden="true" /> Xem trang web</a>
          <button type="button" className="btn ghost" onClick={signOut}><LogOut size={16} aria-hidden="true" /> Đăng xuất</button>
        </span>
      </div>

      {notice && notice.at === pathname && (
        <p className="ok big-notice" role="status">
          {notice.text} {notice.href && <a href={notice.href} target="_blank" rel="noreferrer">Xem trên trang web →</a>}
          <button type="button" className="linkbtn" onClick={() => setNotice(null)}>Đóng</button>
        </p>
      )}

      <Routes>
        <Route index element={<Dashboard {...shared} />} />
        <Route path="tin" element={<PostsScreen {...shared} />} />
        <Route path="tin/moi" element={<PostEditor {...shared} />} />
        <Route path="tin/:slug" element={<PostEditor {...shared} />} />
        <Route path="trang-chu" element={<HomeScreen {...shared} />} />
        <Route path="trang" element={<PagesScreen {...shared} />} />
        <Route path="trang/moi" element={<PageEditor {...shared} />} />
        <Route path="trang/:slug" element={<PageEditor {...shared} />} />
        <Route path="lien-he" element={<SettingsScreen {...shared} />} />
        <Route path="nang-cao" element={<Advanced {...shared} />} />
        <Route path="*" element={<p className="empty">Không có trang này. <Link to="/quan-tri">Về bảng điều khiển</Link></p>} />
      </Routes>
    </div>
  );
}
