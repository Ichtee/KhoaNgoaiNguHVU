import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('blog_theme') || 'dark');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [postEditorOpen, setPostEditorOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('blog_theme', theme);
  }, [theme]);

  useEffect(() => {
    const token = localStorage.getItem('blog_token');
    if (token) {
      api.getMe()
        .then(userData => setUser(userData))
        .catch(() => {
          localStorage.removeItem('blog_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const login = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('blog_token', data.token);
    setUser(data);
    setAuthModalOpen(false);
    return data;
  };

  const register = async (userData) => {
    const data = await api.register(userData);
    localStorage.setItem('blog_token', data.token);
    setUser(data);
    setAuthModalOpen(false);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('blog_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        theme,
        toggleTheme,
        login,
        register,
        logout,
        authModalOpen,
        setAuthModalOpen,
        postEditorOpen,
        setPostEditorOpen
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
