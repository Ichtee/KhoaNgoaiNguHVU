import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './site/Layout';
import Home from './site/Home';
import PostList from './site/PostList';
import PostPage from './site/PostPage';
import PageView from './site/PageView';
import Admin from './site/Admin';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="gioi-thieu" element={<Navigate to="/#gioi-thieu" replace />} />
        <Route path="trang/:slug" element={<PageView />} />
        <Route path="muc/:slug" element={<PostList />} />
        <Route path="tim-kiem" element={<PostList />} />
        <Route path="bai-viet/:slug" element={<PostPage />} />
        <Route path="quan-tri/*" element={<Admin />} />
        <Route path="*" element={<p className="empty">Không tìm thấy trang.</p>} />
      </Route>
    </Routes>
  );
}
