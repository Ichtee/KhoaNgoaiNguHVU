import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import CategoryFilter from '../components/CategoryFilter';
import PostCard from '../components/PostCard';
import { api } from '../services/api';
import { Sparkles, TrendingUp, RefreshCw } from 'lucide-react';

export default function HomePage({ search, onSelectPost }) {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const [catsData, postsData] = await Promise.all([
        api.getCategories(),
        api.getPosts({ search, category: selectedCategory })
      ]);
      setCategories(catsData);
      setPosts(postsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [search, selectedCategory]);

  const featuredPost = posts.find(p => p.isFeatured) || posts[0];
  const regularPosts = posts.filter(p => p._id !== featuredPost?._id);

  const handleLikePost = async (postId) => {
    try {
      const res = await api.likePost(postId);
      setPosts(prev => prev.map(p => (p._id === postId || p.slug === postId) ? { ...p, likes: res.likes } : p));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      {/* Featured Hero */}
      {!search && selectedCategory === 'all' && (
        <Hero featuredPost={featuredPost} onSelectPost={onSelectPost} />
      )}

      {/* Category Filter */}
      <CategoryFilter 
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Section Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp color="var(--accent-primary)" size={22} />
          {search ? `Kết quả tìm kiếm cho "${search}"` : 'Bài Viết Mới Nhất'}
        </h2>
        <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          {posts.length} bài viết
        </span>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 1rem auto' }} />
          <p>Đang tải bài viết...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Sparkles size={40} color="var(--accent-primary)" style={{ margin: '0 auto 1rem auto' }} />
          <h3>Không Tìm Thấy Bài Viết</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Thử tìm kiếm với từ khóa khác hoặc chuyển sang danh mục bài viết khác.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '2rem'
        }}>
          {posts.map(post => (
            <PostCard 
              key={post._id || post.slug} 
              post={post} 
              onSelectPost={onSelectPost}
              onLikePost={handleLikePost}
            />
          ))}
        </div>
      )}

    </div>
  );
}
