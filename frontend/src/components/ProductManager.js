import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API } from '../config';

// channelType is "stand", "parcel", or "delivery_event"; channelId is the id
function ProductManager({ channelType, channelId }) {
  const { t } = useTranslation();
  const CATEGORIES = [
    { value: 'fruit', label: t('buy.categoryFruit') },
    { value: 'vegetable', label: t('buy.categoryVegetable') },
    { value: 'herb', label: t('buy.categoryHerb') },
    { value: 'other', label: t('buy.categoryOther') },
  ];
  const [products, setProducts] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('');
  const [form, setForm] = useState({ catalog_item: '', variety: '', price_per_kg: '' });
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const token = localStorage.getItem('access_token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchData = async () => {
    try {
      const productRes = await axios.get(`${API}/products/?${channelType}=${channelId}`, authHeader);
      setProducts(productRes.data);
      const catalogRes = await axios.get(`${API}/catalog/`, authHeader);
      setCatalog(catalogRes.data);
    } catch (err) {
      console.log('Load error', err.response?.data);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setForm({ ...form, catalog_item: '', variety: '' });
  };

  const filteredCatalog = category ? catalog.filter(c => c.category === category) : [];
  const selectedCatalog = catalog.find(c => String(c.id) === String(form.catalog_item));

  const handleAdd = async () => {
    if (!form.catalog_item || !form.price_per_kg) {
      setMessage(t('productManager.validationError'));
      return;
    }
    try {
      const payload = {
        catalog_item: form.catalog_item,
        variety: form.variety || null,
        price_per_kg: form.price_per_kg,
        [channelType]: channelId
      };
      await axios.post(`${API}/products/`, payload, authHeader);
      setMessage(t('productManager.addSuccess'));
      setCategory('');
      setForm({ catalog_item: '', variety: '', price_per_kg: '' });
      fetchData();
    } catch (err) {
      setMessage(t('productManager.addError'));
      console.log(err.response?.data);
    }
  };

  const toggleActive = async (product) => {
    try {
      await axios.patch(`${API}/products/${product.id}/`, { is_available: !product.is_available }, authHeader);
      fetchData();
    } catch (err) {
      console.log('Toggle error', err.response?.data);
    }
  };

  const startPriceEdit = (p) => {
    setEditingId(p.id);
    setEditPrice(p.price_per_kg);
  };

  const savePrice = async (p) => {
    try {
      await axios.patch(`${API}/products/${p.id}/`, { price_per_kg: editPrice }, authHeader);
      setEditingId(null);
      fetchData();
    } catch (err) {
      console.log('Price edit error', err.response?.data);
    }
  };

  const removeProduct = async (product) => {
    try {
      await axios.delete(`${API}/products/${product.id}/`, authHeader);
      fetchData();
    } catch (err) {
      console.log('Delete error', err.response?.data);
    }
  };

  return (
    <div className="border-top mt-3 pt-3">
      <h6 style={{ color: '#2d6a4f' }}>{t('productManager.title')}</h6>
      {message && <div className="small text-success">{message}</div>}

      <div className="row g-2 align-items-center mb-3">
        <div className="col-auto" style={{ minWidth: '140px' }}>
          <select className="form-select" value={category} onChange={handleCategoryChange}>
            <option value="">{t('productManager.categoryOption')}</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {category && (
          <div className="col-auto" style={{ minWidth: '160px' }}>
            <select name="catalog_item" className="form-select" value={form.catalog_item} onChange={handleChange}>
              <option value="">{t('productManager.productOption', { count: filteredCatalog.length })}</option>
              {filteredCatalog.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        {selectedCatalog && selectedCatalog.varieties.length > 0 && (
          <div className="col-auto" style={{ minWidth: '120px' }}>
            <select name="variety" className="form-select" value={form.variety} onChange={handleChange}>
              <option value="">{t('productManager.varietyOption')}</option>
              {selectedCatalog.varieties.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
        )}

        <div className="col-auto">
          <div className="input-group">
            <span className="input-group-text">{t('productManager.pricePerKg')}</span>
            <input name="price_per_kg" type="number" className="form-control" style={{ maxWidth: '90px' }}
              value={form.price_per_kg} onChange={handleChange} />
          </div>
        </div>

        <div className="col-auto">
          <button onClick={handleAdd} className="btn text-white" style={{ background: '#2d6a4f' }}>
            {t('productManager.addButton')}
          </button>
        </div>
      </div>

      {products.length === 0 && <p className="small text-muted">{t('productManager.empty')}</p>}
      <div className="list-group">
        {products.map(p => (
          <div key={p.id} className="list-group-item d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <strong>{p.catalog_name}</strong>
              {p.variety_name && <span className="text-muted"> ({p.variety_name})</span>}
              {' '}—{' '}
              {editingId === p.id ? (
                <input type="number" className="form-control d-inline-block" style={{ width: '90px' }}
                  value={editPrice} onChange={e => setEditPrice(e.target.value)} />
              ) : (
                <span>€{p.price_per_kg}/kg</span>
              )}
              <span className={`badge ms-2 ${p.is_available ? 'bg-success' : 'bg-secondary'}`}>
                {p.is_available ? t('common.active') : t('productManager.off')}
              </span>
            </div>
            <div className="d-flex gap-2">
              {editingId === p.id ? (
                <>
                  <button onClick={() => savePrice(p)} className="btn btn-sm text-white" style={{ background: '#2d6a4f' }}>
                    {t('common.save')}
                  </button>
                  <button onClick={() => setEditingId(null)} className="btn btn-sm btn-secondary">
                    {t('common.cancel')}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => startPriceEdit(p)} className="btn btn-sm text-white" style={{ background: '#5a8f73' }}>
                    {t('productManager.editPrice')}
                  </button>
                  <button onClick={() => toggleActive(p)} className={`btn btn-sm ${p.is_available ? 'btn-secondary' : 'text-white'}`}
                    style={!p.is_available ? { background: '#2d6a4f' } : {}}>
                    {p.is_available ? t('productManager.off') : t('productManager.on')}
                  </button>
                  <button onClick={() => removeProduct(p)} className="btn btn-sm btn-outline-danger">
                    ✕
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductManager;
