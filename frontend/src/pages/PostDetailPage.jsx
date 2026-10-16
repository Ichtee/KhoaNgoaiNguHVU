import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import CommentSection from '../components/CommentSection';
import { ArrowLeft, Clock, Eye, Heart, Share2, Tag, Calendar, User } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PostDetailPage({ slug, onBack, onSelectPost }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (slug) {
      setLoading(true);
      api.getPostBySlug(slug)
        .then(data => {
          setPost(data);
          setLikesCount(data.likes || 0);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [slug]);

  const handleLike = async () => {
    if (!post) return;
    try {
      const res = await api.likePost(post._id || post.slug);
      setLikesCount(res.likes);
      setLiked(true);
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 } });
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert('Đã sao chép đường dẫn bài viết vào bộ nhớ tạm!');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: '1.2rem' }}>Đang tải bài viết...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem', margin: '3rem 0' }}>
        <h2>Không Tìm Thấy Bài Viết</h2>
        <button className="btn-primary" onClick={onBack} style={{ marginTop: '1.5rem' }}>
          <ArrowLeft size={16} /> Quay Lại Trang Chủ
        </button>
      </div>
    );
  }

  return (
    <article className="animate-fade-in" style={{ maxWidth: '860px', margin: '1.5rem auto 0 auto' }}>
      
      {/* Back Button */}
      <button 
        onClick={onBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--text-muted)',
          fontWeight: 600,
          marginBottom: '1.5rem',
          fontSize: '0.95rem'
        }}
      >
        <ArrowLeft size={18} /> Quay Lại Trang Chủ
      </button>

      {/* Category Badge */}
      <div style={{ marginBottom: '1rem' }}>
        <span style={{
          backgroundColor: post.category?.color || '#6366f1',
          color: '#ffffff',
          padding: '0.35rem 0.9rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.82rem',
          fontWeight: 700
        }}>
          {post.category?.name || 'Công nghệ'}
        </span>
      </div>

      {/* Title */}
      <h1 style={{ fontSize: '2.4rem', lineHeight: 1.3, marginBottom: '1.25rem', color: 'var(--text-main)' }}>
        {post.title}
      </h1>

      {/* Author & Meta Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1.25rem 0',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '2rem'
      }}>
        
        {/* Author Avatar & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <img 
            src={post.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} 
            alt={post.author?.name} 
            style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{post.author?.name || 'Tác giả'}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{post.author?.bio || 'Tác giả DevSphere'}</div>
          </div>
        </div>

        {/* Read Time & Views */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={16} /> {new Date(post.createdAt).toLocaleDateString('vi-VN')}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={16} /> {post.readTime || 5} phút đọc
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Eye size={16} /> {post.views || 0} lượt xem
          </span>
        </div>

      </div>

      {/* Cover Image */}
      <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '2.5rem', maxHeight: '440px' }}>
        <img 
          src={post.coverImage} 
          alt={post.title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Article Body Content (Markdown style) */}
      <div className="markdown-body" style={{ marginBottom: '3rem' }}>
        {post.content}
      </div>

      {/* Like & Share Action Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.5rem',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-tertiary)',
        marginBottom: '3rem'
      }}>
        <button 
          onClick={handleLike}
          className="btn-primary"
          style={{
            background: liked ? '#ef4444' : 'var(--accent-gradient)',
            boxShadow: liked ? '0 4px 14px rgba(239, 68, 68, 0.4)' : '0 4px 14px var(--accent-glow)'
          }}
        >
          <Heart size={18} fill={liked ? '#fff' : 'none'} /> 
          {liked ? 'Đã thích' : 'Thích bài viết'} ({likesCount})
        </button>

        <button 
          onClick={handleShare}
          className="btn-secondary"
        >
          <Share2 size={16} /> Chia Sẻ
        </button>
      </div>

      {/* Author Bio Box */}
      <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '3rem' }}>
        <img 
          src={post.author?.avatar} 
          alt={post.author?.name} 
          style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }}
        />
        <div>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Về tác giả {post.author?.name}</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{post.author?.bio}</p>
        </div>
      </div>

      {/* Comment Section */}
      <CommentSection postId={post._id || post.slug} />

    </article>
  );
}
