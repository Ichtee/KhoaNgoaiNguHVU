import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { PenSquare, Trash2, Eye, Heart, FileText, Sparkles, UserCheck } from 'lucide-react';

export default function DashboardPage({ onSelectPost }) {
  const { user, setPostEditorOpen } = useAuth();
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyPosts = async () => {
    setLoading(true);
    try {
      const allPosts = await api.getPosts();
      if (user) {
        setMyPosts(allPosts.filter(p => p.author?._id === user._id || p.author?.email === user.email));
      } else {
        setMyPosts(allPosts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPosts();
  }, [user]);

  const handleDelete = async (postId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      try {
        await api.deletePost(postId);
        setMyPosts(prev => prev.filter(p => p._id !== postId));
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const totalViews = myPosts.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalLikes = myPosts.reduce((acc, p) => acc + (p.likes || 0), 0);

  return (
    <div className="animate-fade-in" style={{ padding: '1rem 0 3rem 0' }}>
      
      {/* User Header Profile */}
      <div className="glass-card" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <img 
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'} 
            alt={user?.name} 
            style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-primary)' }}
          />
          <div>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>Studio Tác Giả: {user?.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user?.bio || 'Chuyên gia Lập trình & Viết Blog Tech'}</p>
          </div>
        </div>

        <button 
          className="btn-primary" 
          onClick={() => setPostEditorOpen(true)}
        >
          <PenSquare size={18} /> Soạn Bài Viết Mới
        </button>

      </div>

      {/* Analytics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem',
        marginBottom: '3rem'
      }}>
        
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>Tổng Số Bài Viết</span>
            <FileText size={22} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{myPosts.length}</div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#10b981', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>Tổng Lượt Xem</span>
            <Eye size={22} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{totalViews}</div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#ef4444', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>Tổng Lượt Thích</span>
            <Heart size={22} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{totalLikes}</div>
        </div>

      </div>

      {/* My Posts Table */}
      <div className="glass-card" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem' }}>Danh Sách Bài Viết Của Tôi</h3>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Đang tải danh sách bài viết...</p>
        ) : myPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <p>Bạn chưa xuất bản bài viết nào.</p>
            <button className="btn-primary" onClick={() => setPostEditorOpen(true)} style={{ marginTop: '1rem' }}>
              Viết bài viết đầu tiên ngay!
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.92rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.85rem' }}>Bài Viết</th>
                  <th style={{ padding: '0.85rem' }}>Danh Mục</th>
                  <th style={{ padding: '0.85rem' }}>Lượt Xem</th>
                  <th style={{ padding: '0.85rem' }}>Thích</th>
                  <th style={{ padding: '0.85rem' }}>Ngày Tạo</th>
                  <th style={{ padding: '0.85rem', textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {myPosts.map(post => (
                  <tr key={post._id || post.slug} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    
                    <td style={{ padding: '1rem 0.85rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => onSelectPost(post.slug)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img src={post.coverImage} alt={post.title} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                        <span style={{ color: 'var(--text-main)' }}>{post.title}</span>
                      </div>
                    </td>

                    <td style={{ padding: '1rem 0.85rem' }}>
                      <span style={{
                        backgroundColor: post.category?.color || '#6366f1',
                        color: '#fff',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        {post.category?.name || 'Công nghệ'}
                      </span>
                    </td>

                    <td style={{ padding: '1rem 0.85rem' }}>{post.views || 0}</td>
                    <td style={{ padding: '1rem 0.85rem', color: '#ef4444', fontWeight: 600 }}>{post.likes || 0}</td>
                    <td style={{ padding: '1rem 0.85rem', color: 'var(--text-muted)' }}>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</td>

                    <td style={{ padding: '1rem 0.85rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDelete(post._id)}
                        style={{ color: '#ef4444', padding: '0.4rem', borderRadius: '4px' }}
                        title="Xóa bài viết"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
