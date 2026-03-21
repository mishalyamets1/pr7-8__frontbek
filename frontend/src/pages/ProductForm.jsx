import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI } from '../api';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      productsAPI.getById(id).then(res => {
        const p = res.data;
        setTitle(p.title || '');
        setCategory(p.category || '');
        setDescription(p.description || '');
        setPrice(String(p.price ?? ''));
        setCurrentImage(p.image || null);
      }).catch(() => navigate('/products'));
    }
  }, [id]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('description', description);
    formData.append('price', price);
    if (imageFile) formData.append('image', imageFile);

    try {
      if (isEdit) {
        await productsAPI.update(id, formData);
      } else {
        await productsAPI.create(formData);
      }
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка сохранения');
    }
  };

  const previewSrc = imagePreview || currentImage || null;

  return (
    <div>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        ← Назад
      </button>
      <div className="card">
        <h2>{isEdit ? 'Редактировать товар' : 'Новый товар'}</h2>
        {error && <div className="error-msg" style={{ marginTop: 12 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
          <div className="form-group">
            <label>Название</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Категория</label>
            <input value={category} onChange={e => setCategory(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Описание</label>
            <input value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Цена</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Картинка</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
          </div>
          {previewSrc && (
            <div style={{ marginBottom: 16 }}>
              <img src={previewSrc} alt="preview" style={{ maxWidth: 240, maxHeight: 180, borderRadius: 6, objectFit: 'cover' }} />
            </div>
          )}
          <button type="submit" className="btn btn-primary">{isEdit ? 'Сохранить' : 'Создать'}</button>
        </form>
      </div>
    </div>
  );
}
