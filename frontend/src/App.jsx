import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './site/Layout';
import Home from './site/Home';
import PostList from './site/PostList';
import PostPage from './site/PostPage';
import PageView from './site/PageView';
import Admin from './site/Admin';
import Draft from './site/Draft';

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
        {/* the admin area: the same pages with editing tools; Layout lets nothing here render before the server confirms the session */}
        <Route path="quan-tri">
          <Route index element={<Home />} />
          <Route path="trang/:slug" element={<PageView />} />
          <Route path="muc/:slug" element={<PostList />} />
          <Route path="tim-kiem" element={<PostList />} />
          <Route path="bai-viet/:slug" element={<PostPage />} />
          <Route path="*" element={<Admin />} />
        </Route>
        <Route path="xem-nhap" element={<Draft />} />
        <Route path="*" element={<p className="empty">Không tìm thấy trang.</p>} />
      </Route>
    </Routes>
  );
}
