import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, User } from 'lucide-react';

export default function CommentSection({ postId }) {
  const { user, setAuthModalOpen } = useAuth();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [guestName, setGuestName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (postId) {
      api.getComments(postId).then(data => setComments(data)).catch(() => {});
    }
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const newComment = await api.addComment({
        postId,
        content,
        authorName: user ? user.name : (guestName.trim() || 'Độc giả ẩn danh'),
        authorAvatar: user ? user.avatar : undefined
      });
      setComments(prev => [newComment, ...prev]);
      setContent('');
      setGuestName('');
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-subtle)' }}>
      
      <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <MessageSquare size={20} color="var(--accent-primary)" />
        Bình Luận ({comments.length})
      </h3>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        
        {!user && (
          <div style={{ marginBottom: '1rem' }}>
            <input 
              type="text" 
              placeholder="Tên của bạn (hoặc Đăng nhập để tự động điền)" 
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>
        )}

        <textarea 
          placeholder="Chia sẻ suy nghĩ của bạn về bài viết này..." 
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-main)',
            fontSize: '0.95rem',
            outline: 'none',
            resize: 'vertical',
            marginBottom: '1rem'
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {!user ? (
            <button 
              type="button" 
              onClick={() => setAuthModalOpen(true)} 
              style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600 }}
            >
              Đăng nhập tài khoản
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Đang bình luận với tên <strong>{user.name}</strong>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={submitting}
            style={{ padding: '0.55rem 1.25rem', fontSize: '0.88rem' }}
          >
            <Send size={15} /> {submitting ? 'Đang gửi...' : 'Gửi Bình Luận'}
          </button>
        </div>

      </form>

      {/* Comment List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {comments.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>
            Chưa có bình luận nào. Hãy là người đầu tiên để lại ý kiến!
          </p>
        ) : (
          comments.map(c => (
            <div key={c._id} className="glass-card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.65rem' }}>
                <img 
                  src={c.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'} 
                  alt={c.authorName} 
                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{c.authorName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(c.createdAt).toLocaleDateString('vi-VN')} {new Date(c.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                {c.content}
              </p>
            </div>
          ))
        )}
      </div>

    </section>
  );
}
