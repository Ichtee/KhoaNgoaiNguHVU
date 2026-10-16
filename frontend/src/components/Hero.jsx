import React from 'react';
import { Clock, Eye, Heart, ArrowRight, Sparkles } from 'lucide-react';

export default function Hero({ featuredPost, onSelectPost }) {
  if (!featuredPost) return null;

  return (
    <section style={{ margin: '2rem 0 3rem 0' }}>
      <div 
        className="glass-card animate-fade-in"
        onClick={() => onSelectPost(featuredPost.slug)}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          cursor: 'pointer',
          border: '1px solid var(--border-glass)',
          background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)'
        }}
      >
        {/* Text Area */}
        <div style={{ padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <span style={{
              background: 'var(--accent-gradient)',
              color: '#fff',
              padding: '0.35rem 0.9rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <Sparkles size={14} /> BÀI VIẾT NỔI BẬT
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {new Date(featuredPost.createdAt).toLocaleDateString('vi-VN')}
            </span>
          </div>

          <h2 style={{ fontSize: '2rem', lineHeight: 1.3, marginBottom: '1rem', color: 'var(--text-main)' }}>
            {featuredPost.title}
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '1.75rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {featuredPost.excerpt}
          </p>

          {/* Author & Meta */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img 
                src={featuredPost.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} 
                alt={featuredPost.author?.name} 
                style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{featuredPost.author?.name || 'Tác giả'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{featuredPost.author?.role || 'Author'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={16} /> {featuredPost.readTime || 5} phút
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Eye size={16} /> {featuredPost.views || 0}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#ef4444' }}>
                <Heart size={16} fill="#ef4444" /> {featuredPost.likes || 0}
              </span>
            </div>

          </div>

          <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
            Đọc bài viết chi tiết <ArrowRight size={18} />
          </div>

        </div>

        {/* Image Area */}
        <div style={{ position: 'relative', minHeight: '320px', overflow: 'hidden' }}>
          <img 
            src={featuredPost.coverImage} 
            alt={featuredPost.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.5s ease'
            }} 
          />
        </div>

      </div>
    </section>
  );
}
