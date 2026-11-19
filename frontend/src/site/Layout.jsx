import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUp, Menu, X, Mail, Facebook, MapPin, Phone, Search } from 'lucide-react';
import { api, getToken, setToken } from '../api';
import { AdminContext } from './admin/OnSite';
import { Login } from './Admin';
import { topLevel, childrenOf } from './tree';

export default function Layout() {
  const [cats, setCats] = useState([]);
  const [pages, setPages] = useState([]);
  const [site, setSite] = useState({}); // name, contact details and links, edited in the admin
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [showTop, setShowTop] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // The admin (/quan-tri) is a dashboard. Nothing of it renders until the server
  // confirms the session: 'checking' -> 'ok', or 'login' (no or dead token) / 'offline' (server unreachable).
  // The public site never shows admin tools, whoever is logged in.
  const inAdmin = pathname === '/quan-tri' || pathname.startsWith('/quan-tri/');
  const [access, setAccess] = useState('checking');
  const checkAccess = useCallback((quiet) => {
    if (!getToken()) return setAccess('login');
    if (!quiet) setAccess('checking');
    api.session().then(() => setAccess('ok')).catch((err) => {
      if (/đăng nhập/i.test(err.message)) { setToken(null); setAccess('login'); } else if (!quiet) setAccess('offline');
    });
  }, []);
  useEffect(() => { if (inAdmin) checkAccess(false); }, [inAdmin, checkAccess]);
  // back on the tab after a while: ask again, so a session ended elsewhere stops working here too
  useEffect(() => {
    if (!inAdmin) return undefined;
    const again = () => checkAccess(true);
    window.addEventListener('focus', again);
    return () => window.removeEventListener('focus', again);
  }, [inAdmin, checkAccess]);
  // the admin area stays out of search engines
  useEffect(() => {
    if (!inAdmin) return undefined;
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, [inAdmin]);
  const signOut = useCallback(() => {
    api.logout().catch(() => {});
    setToken(null);
    setAccess('login');
    navigate('/');
  }, [navigate]);
  const admin = inAdmin && access === 'ok';
  const adminCtx = useMemo(() => ({ admin, signOut, refresh: () => checkAccess(true) }), [admin, signOut, checkAccess]);
  const refreshAdmin = adminCtx.refresh;

  // also called by the admin after it changes categories, pages or settings, so the site follows
  const reload = useCallback(
    () => Promise.all([api.categories(), api.pages(), api.settings()])
      .then(([c, p, s]) => { setCats(c); setPages(p); setSite(s); })
      .catch(() => {}),
    []
  );

  useEffect(() => {
    if (site.name) document.title = [site.name, site.university].filter(Boolean).join(' - ');
    if (site.logo) document.querySelector('link[rel="icon"]')?.setAttribute('href', site.logo);
  }, [site]);

  useEffect(() => {
    reload();
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [reload]);

  const close = () => setOpen(false);

  const search = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    close();
    navigate(`/tim-kiem?q=${encodeURIComponent(q.trim())}`);
  };

  const toTop = () => {
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
  };

  // a top-level item is "active" on its own page, its children's pages and the fixed pages under it
  const menu = topLevel(cats).map((c) => {
    const kids = childrenOf(cats, c.slug);
    const own = pages.filter((p) => p.group === c.slug);
    const active = [`/muc/${c.slug}`, ...kids.map((k) => `/muc/${k.slug}`), ...own.map((p) => `/trang/${p.slug}`)].includes(pathname);
    return { ...c, kids, own, active };
  });

  return (
    <AdminContext.Provider value={adminCtx}>
      <a className="skip" href="#main">Bỏ qua menu, đến nội dung chính</a>

      <header className="top">
        <div className="page bar">
          <Link to="/" className="brand" onClick={close}>
            <img src={site.logo || '/logo-khoa.png'} alt="" width="40" height="40" />
            <span>
              <b>{site.name}</b>
              <small>{site.university}</small>
            </span>
          </Link>

          <nav className={open ? 'open' : ''}>
            <button className="burger" aria-label={open ? 'Đóng menu' : 'Mở menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="links">
              <NavLink to="/" end onClick={close}>Trang chủ</NavLink>
              {menu.map((c) => (
                <div className="item" key={c.slug}>
                  <Link to={`/muc/${c.slug}`} className={c.active ? 'active' : ''} onClick={close}>{c.name}</Link>
                  {(c.own.length > 0 || c.kids.length > 0) && (
                    <div className="sub">
                      {c.own.map((p) => <Link key={p.slug} to={`/trang/${p.slug}`} onClick={close}>{p.title}</Link>)}
                      {c.kids.map((k) => <Link key={k.slug} to={`/muc/${k.slug}`} onClick={close}>{k.name}</Link>)}
                    </div>
                  )}
                </div>
              ))}
              <form onSubmit={search} role="search">
                <Search size={16} />
                <input type="search" aria-label="Tìm kiếm bài viết" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm bài viết" />
              </form>
            </div>
          </nav>
        </div>
      </header>

      <main id="main" className={pathname === '/' ? '' : 'page'}> {/* home draws its own full-width hero */}
        {inAdmin && access !== 'ok' ? (
          <div className="page">
            {access === 'checking' && <p className="empty" role="status">Đang kiểm tra quyền truy cập…</p>}
            {access === 'offline' && <p className="empty" role="alert">Không kết nối được máy chủ để kiểm tra đăng nhập. <button type="button" className="linkbtn" onClick={() => checkAccess(false)}>Thử lại</button></p>}
            {access === 'login' && <Login onDone={() => setAccess('ok')} />}
          </div>
        ) : (
          /* one key for the management screens, so moving between them does not reload everything */
          <div key={inAdmin ? 'quan-tri' : pathname} className="route">
            <Outlet context={{ cats, pages, site, reload, admin, refreshAdmin }} />
          </div>
        )}
      </main>

      <button className={`totop ${showTop ? 'show' : ''}`} aria-label="Lên đầu trang" tabIndex={showTop ? 0 : -1} onClick={toTop}>
        <ArrowUp size={22} />
      </button>

      <footer>
        <div className="page foot">
          <div>
            <h3>{site.name}</h3>
            <p>{site.university}<br />{site.tagline}</p>
          </div>
          <div>
            <h4>Liên hệ</h4>
            {site.address && <p><MapPin size={15} /> {site.address}</p>}
            {site.phone && <p><Phone size={15} /> {site.phone}</p>}
            {site.email && <p><Mail size={15} /> <a href={`mailto:${site.email}`}>{site.email}</a></p>}
          </div>
          <div>
            <h4>Liên kết</h4>
            {site.facebook && <p><Facebook size={15} /> <a href={site.facebook} target="_blank" rel="noreferrer">Facebook của khoa</a></p>}
            {site.website && <p><a href={site.website} target="_blank" rel="noreferrer">Website {site.university}</a></p>}
          </div>
        </div>
        <div className="page copy">© {new Date().getFullYear()} {[site.name, site.university].filter(Boolean).join(' – ')}</div>
      </footer>
    </AdminContext.Provider>
  );
}
