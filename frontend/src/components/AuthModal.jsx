import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, Sparkles } from 'lucide-react';

export default function AuthModal() {
  const { authModalOpen, setAuthModalOpen, login, register } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isLoginView) {
        await login(email, password);
      } else {
        await register({ name, email, password, bio });
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('hoanganh@techblog.vn');
    setPassword('123456');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '2.5rem 2rem',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-secondary)'
      }}>
        
        {/* Close Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => setAuthModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
            <X size={22} />
          </button>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '16px',
            background: 'var(--accent-gradient)',
            margin: '0 auto 1rem auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 6px 16px var(--accent-glow)'
          }}>
            <Sparkles size={26} />
          </div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>
            {isLoginView ? 'Chào Mừng Trở Lại!' : 'Tham Gia DevSphere'}
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            {isLoginView ? 'Đăng nhập để tạo và quản lý các bài viết của bạn' : 'Tạo tài khoản tác giả chỉ trong vài giây'}
          </p>
        </div>

        {errorMsg && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            fontSize: '0.88rem',
            marginBottom: '1.25rem',
            textAlign: 'center'
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          {!isLoginView && (
            <div style={{ marginBottom: '1rem', position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Họ và tên của bạn"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.7rem 1rem 0.7rem 2.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-main)',
                  outline: 'none'
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '1rem', position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="email" 
              placeholder="Địa chỉ Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.7rem 1rem 0.7rem 2.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-main)',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="password" 
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.7rem 1rem 0.7rem 2.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-main)',
                outline: 'none'
              }}
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
          >
            {loading ? 'Đang xử lý...' : (isLoginView ? 'Đăng Nhập' : 'Tạo Tài Khoản')}
          </button>

        </form>

        {/* Demo Account Quick Fill Button */}
        {isLoginView && (
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={fillDemoAccount}
              style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', textDecoration: 'underline' }}
            >
              💡 Điền nhanh tài khoản Demo (hoanganh@techblog.vn)
            </button>
          </div>
        )}

        {/* Toggle Login/Register */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          {isLoginView ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
          <button 
            type="button" 
            onClick={() => { setIsLoginView(!isLoginView); setErrorMsg(''); }}
            style={{ color: 'var(--accent-primary)', fontWeight: 700 }}
          >
            {isLoginView ? 'Đăng ký ngay' : 'Đăng nhập'}
          </button>
        </div>

      </div>
    </div>
  );
}
