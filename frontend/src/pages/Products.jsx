import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../api';

export default function Products({ user }) {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    productsAPI.getAll().then(res => setProducts(res.data)).catch(() => {});
  }, []);

  const canCreate = user.role === 'seller' || user.role === 'admin';

  return (
    <div>
      <div className="page-header">
        <h2>Товары</h2>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => navigate('/products/new')}>
            + Добавить товар
          </button>
        )}
      </div>
      {products.length === 0 ? (
        <p>Товаров пока нет.</p>
      ) : (
        <div className="product-grid">
          {products.map(p => (
            <div key={p.id} className="product-card" onClick={() => navigate(`/products/${p.id}`)}>
              {p.image ? (
                <img
                  src={p.image}
                  alt={p.title}
                  style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 4, marginBottom: 10 }}
                />
              ) : (
                <div style={{ width: '100%', height: 160, background: '#e0e0e0', borderRadius: 4, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9e9e9e' }}>
                  Нет фото
                </div>
              )}
              <h3>{p.title}</h3>
              <div className="price">{p.price} ₽</div>
              {p.category && <div className="category">{p.category}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
