import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authAPI } from './api';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import ProductForm from './pages/ProductForm';
import Users from './pages/Users';
import Layout from './components/Layout';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await authAPI.me();
      setUser(res.data);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUser(); }, []);

  const handleLogout = () => {
    const rt = localStorage.getItem('refreshToken');
    if (rt) authAPI.logout(rt).catch(() => {});
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <BrowserRouter>
      <Routes>
        {!user ? (
          <>
            <Route path="/login" element={<Login onLogin={fetchUser} />} />
            <Route path="/register" element={<Register onRegister={fetchUser} />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        ) : (
          <Route element={<Layout user={user} onLogout={handleLogout} />}>
            <Route path="/products" element={<Products user={user} />} />
            <Route path="/products/new" element={<ProductForm user={user} />} />
            <Route path="/products/:id" element={<ProductDetail user={user} />} />
            <Route path="/products/:id/edit" element={<ProductForm user={user} />} />
            {user.role === 'admin' && (
              <Route path="/users" element={<Users />} />
            )}
            <Route path="*" element={<Navigate to="/products" />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
