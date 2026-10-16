import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Search, PenSquare, LogIn, LogOut, User, Sparkles, LayoutDashboard } from 'lucide-react';

export default function Navbar({ search, setSearch, currentTab, setCurrentTab }) {
  const { user, logout, theme, toggleTheme, setAuthModalOpen, setPostEditorOpen } = useAuth();

  return (
    <header className="glass-header sticky-top" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="container" style={{ height: '76px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand Logo */}
        <div 
          onClick={() => setCurrentTab('home')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px var(--accent-glow)'
          }}>
            <Sparkles size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
              Dev<span className="gradient-text">Sphere</span>
            </h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Tech & Engineering Blog</span>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ flex: 1, maxWidth: '400px', margin: '0 1.5rem', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Tìm kiếm bài viết, tác giả, thẻ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 1rem 0.65rem 2.5rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-main)',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
          />
        </div>

        {/* Navigation Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          
          {/* Navigation Links */}
          <button 
            onClick={() => setCurrentTab('home')} 
            style={{ 
              fontWeight: 600, 
              color: currentTab === 'home' ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontSize: '0.95rem'
            }}
          >
            Trang Chủ
          </button>

          {user && (
            <button 
              onClick={() => setCurrentTab('dashboard')} 
              style={{ 
                fontWeight: 600, 
                color: currentTab === 'dashboard' ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <LayoutDashboard size={16} /> Quản Lý
            </button>
          )}

          {/* Create Post Button */}
          <button 
            className="btn-primary" 
            onClick={() => {
              if (!user) setAuthModalOpen(true);
              else setPostEditorOpen(true);
            }}
            style={{ padding: '0.6rem 1.1rem', fontSize: '0.88rem' }}
          >
            <PenSquare size={16} /> Viết Bài
          </button>

          {/* Theme Switcher Button */}
          <button 
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Chuyển qua giao diện Sáng' : 'Chuyển qua giao diện Tối'}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-subtle)'
            }}
          >
            {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
          </button>

          {/* Auth Button */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
              <img 
                src={user.avatar} 
                alt={user.name} 
                style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-primary)' }} 
              />
              <button 
                onClick={logout}
                title="Đăng xuất"
                style={{ color: 'var(--text-muted)', padding: '6px' }}
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button 
              className="btn-secondary"
              onClick={() => setAuthModalOpen(true)}
              style={{ padding: '0.6rem 1.1rem', fontSize: '0.88rem' }}
            >
              <LogIn size={16} /> Đăng Nhập
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
