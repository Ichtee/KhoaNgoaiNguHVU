import React from 'react';
import { Clock, Eye, Heart, Tag } from 'lucide-react';

export default function PostCard({ post, onSelectPost, onLikePost }) {
  const categoryColor = post.category?.color || '#6366f1';

  return (
    <div 
      className="glass-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        cursor: 'pointer'
      }}
      onClick={() => onSelectPost(post.slug)}
    >
      {/* Cover Image Header */}
      <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
        <img 
          src={post.coverImage} 
          alt={post.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease'
          }}
        />
        {/* Category Badge */}
        <span style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          backgroundColor: categoryColor,
          color: '#ffffff',
          padding: '0.3rem 0.75rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem',
          fontWeight: 700,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          {post.category?.name || 'Công nghệ'}
        </span>
      </div>

      {/* Content Area */}
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        
        {/* Title */}
        <h3 style={{
          fontSize: '1.25rem',
          lineHeight: 1.4,
          marginBottom: '0.75rem',
          color: 'var(--text-main)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {post.title}
        </h3>

        {/* Excerpt */}
        <p style={{
          fontSize: '0.9rem',
          color: 'var(--text-muted)',
          marginBottom: '1.25rem',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          flex: 1
        }}>
          {post.excerpt}
        </p>

        {/* Tags Pills */}
        {post.tags && post.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {post.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-muted)',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <Tag size={10} /> #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Card Footer: Author & Stats */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.82rem',
          color: 'var(--text-muted)'
        }}>
          {/* Author */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img 
              src={post.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'} 
              alt={post.author?.name} 
              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{post.author?.name || 'Tác giả'}</span>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Clock size={14} /> {post.readTime || 5}m
            </span>
            <span 
              onClick={(e) => {
                e.stopPropagation();
                if (onLikePost) onLikePost(post._id || post.slug);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                color: '#ef4444',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <Heart size={14} fill="#ef4444" /> {post.likes || 0}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
