import React, { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUp, Menu, X, Mail, Facebook, MapPin, Phone, Search } from 'lucide-react';
import { api } from '../api';
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

  // also called by the admin after it changes categories, pages or settings, so the site follows
  const reload = useCallback(
    () => Promise.all([api.categories(), api.pages(), api.settings()])
      .then(([c, p, s]) => { setCats(c); setPages(p); setSite(s); })
      .catch(() => {}),
    []
  );

  useEffect(() => {
    if (site.name) document.title = [site.name, site.university].filter(Boolean).join(' - ');
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
    <>
      <a className="skip" href="#main">Bỏ qua menu, đến nội dung chính</a>

      <header className="top">
        <div className="page bar">
          <Link to="/" className="brand" onClick={close}>
            <img src="/logo-khoa.png" alt="" width="40" height="40" />
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
        {/* one key for the whole admin, so moving between its sections does not reload everything */}
        <div key={pathname.startsWith('/quan-tri') ? '/quan-tri' : pathname} className="route">
          <Outlet context={{ cats, pages, site, reload }} />
        </div>
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
    </>
  );
}
