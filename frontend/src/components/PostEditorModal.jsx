import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { X, Sparkles, Image, Tag, BookOpen, Eye, Edit3 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PostEditorModal({ categories, onPostCreated }) {
  const { postEditorOpen, setPostEditorOpen } = useAuth();
  
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?._id || categories[0]?.slug || '');
  const [tags, setTags] = useState('React, Node, Tech');
  const [readTime, setReadTime] = useState(5);
  const [isFeatured, setIsFeatured] = useState(false);
  
  const [activeTab, setActiveTab] = useState('write'); // 'write' or 'preview'
  const [submitting, setSubmitting] = useState(false);

  if (!postEditorOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const created = await api.createPost({
        title,
        excerpt,
        content,
        coverImage: coverImage || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80',
        categoryId: categoryId || categories[0]?._id,
        tags: tags.split(',').map(t => t.trim()),
        readTime: Number(readTime) || 5,
        isFeatured
      });

      // Trigger confetti celebration effect
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });

      if (onPostCreated) onPostCreated(created);
      setPostEditorOpen(false);
      
      // Reset form
      setTitle('');
      setExcerpt('');
      setContent('');
      setCoverImage('');
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
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
        maxWidth: '900px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '2rem',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-secondary)'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles color="var(--accent-primary)" size={22} />
            <h2 style={{ fontSize: '1.5rem' }}>Tạo Bài Viết Mới</h2>
          </div>
          <button onClick={() => setPostEditorOpen(false)} style={{ color: 'var(--text-muted)' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          
          {/* Title */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>
              Tiêu đề bài viết *
            </label>
            <input 
              type="text" 
              placeholder="VD: Hướng Dẫn Tối Ưu Hiệu Năng React App..." 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-main)',
                fontSize: '1rem',
                fontWeight: 600,
                outline: 'none'
              }}
            />
          </div>

          {/* Excerpt */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>
              Tóm tắt ngắn (Excerpt) *
            </label>
            <input 
              type="text" 
              placeholder="Mô tả tóm tắt ngắn khoảng 2-3 câu thu hút độc giả..." 
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              required
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

          {/* Grid options */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            
            {/* Category */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                Danh mục *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
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
              >
                {categories.map(c => (
                  <option key={c._id || c.slug} value={c._id || c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Cover Image */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                URL Ảnh Bìa (Unsplash/Web)
              </label>
              <input 
                type="url" 
                placeholder="https://images.unsplash.com/..." 
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
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

            {/* Tags */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                Thẻ / Tags (cách nhau bởi phẩy)
              </label>
              <input 
                type="text" 
                placeholder="React, Frontend, Web" 
                value={tags}
                onChange={(e) => setTags(e.target.value)}
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

          </div>

          {/* Content Editor with Write/Preview toggle */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Nội dung Markdown *</label>
              <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '3px', borderRadius: 'var(--radius-sm)' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('write')}
                  style={{
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    borderRadius: '4px',
                    background: activeTab === 'write' ? 'var(--bg-secondary)' : 'transparent',
                    color: activeTab === 'write' ? 'var(--accent-primary)' : 'var(--text-muted)'
                  }}
                >
                  <Edit3 size={12} /> Viết
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  style={{
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    borderRadius: '4px',
                    background: activeTab === 'preview' ? 'var(--bg-secondary)' : 'transparent',
                    color: activeTab === 'preview' ? 'var(--accent-primary)' : 'var(--text-muted)'
                  }}
                >
                  <Eye size={12} /> Xem Trước
                </button>
              </div>
            </div>

            {activeTab === 'write' ? (
              <textarea 
                rows={10}
                placeholder="Nhập nội dung bài viết hỗ trợ định dạng Markdown (Ví dụ: ## Tiêu đề 2, ```js code ```, > Trích dẫn)..." 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-main)',
                  fontSize: '0.95rem',
                  fontFamily: 'monospace',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            ) : (
              <div className="markdown-body" style={{
                padding: '1rem',
                minHeight: '220px',
                maxHeight: '300px',
                overflowY: 'auto',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary)'
              }}>
                {content ? content : <p style={{ color: 'var(--text-muted)' }}>Chưa có nội dung xem trước...</p>}
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => setPostEditorOpen(false)}
            >
              Hủy Bỏ
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={submitting}
            >
              {submitting ? 'Đang Xuất Bản...' : 'Xuất Bản Bài Viết'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
