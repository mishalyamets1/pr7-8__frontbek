import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI } from '../api';

export default function ProductDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    productsAPI.getById(id).then(res => setProduct(res.data)).catch(() => navigate('/products'));
  }, [id]);

  if (!product) return <p>Загрузка...</p>;

  const canEdit = user.role === 'seller' || user.role === 'admin';
  const canDelete = user.role === 'admin';

  const handleDelete = async () => {
    if (!window.confirm('Удалить товар?')) return;
    await productsAPI.delete(id);
    navigate('/products');
  };

  return (
    <div className="product-detail">
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/products')} style={{ marginBottom: 16 }}>
        ← Назад
      </button>
      <div className="card">
        {product.image && (
          <img
            src={product.image}
            alt={product.title}
            style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 6, marginBottom: 16 }}
          />
        )}
        <h2>{product.title}</h2>
        <p style={{ fontSize: '1.4rem', fontWeight: 600, color: '#1976d2', margin: '12px 0' }}>{product.price} ₽</p>
        {product.category && <p><strong>Категория:</strong> {product.category}</p>}
        {product.description && <p style={{ marginTop: 8 }}>{product.description}</p>}
        <div className="actions">
          {canEdit && (
            <button className="btn btn-primary btn-sm" onClick={() => navigate(`/products/${id}/edit`)}>
              Редактировать
            </button>
          )}
          {canDelete && (
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>
              Удалить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
