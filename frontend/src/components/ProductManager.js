import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../config';

// channelType is "stand", "parcel", or "delivery_event"; channelId is the id
function ProductManager({ channelType, channelId }) {
  const [products, setProducts] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [message, setMessage] = useState('');
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
  }, [channelId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const selectedCatalog = catalog.find(c => String(c.id) === String(form.catalog_item));

  const handleAdd = async () => {
    if (!form.catalog_item || !form.price_per_kg) {
      setMessage('Pick a product and set a price!');
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
      setMessage('Added! ✅');
      setForm({ catalog_item: '', variety: '', price_per_kg: '' });
      fetchData();
    } catch (err) {
      setMessage('Error adding product.');
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
    <div style={{ background: '#fafafa', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
      <h4 style={{ marginTop: 0 }}>Products here</h4>
      {message && <p style={{ color: '#2d6a4f', fontSize: '14px' }}>{message}</p>}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <select name="catalog_item" value={form.catalog_item} onChange={handleChange}
          style={{ padding: '8px', flex: '1 1 150px' }}>
          <option value="">-- Product --</option>
          {catalog.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {selectedCatalog && selectedCatalog.varieties.length > 0 && (
          <select name="variety" value={form.variety} onChange={handleChange}
            style={{ padding: '8px', flex: '1 1 120px' }}>
            <option value="">-- Variety --</option>
            {selectedCatalog.varieties.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        )}

        <input name="price_per_kg" type="number" placeholder="€/kg" value={form.price_per_kg}
          onChange={handleChange} style={{ padding: '8px', width: '90px' }} />

        <button onClick={handleAdd}
          style={{ padding: '8px 16px', background: '#2d6a4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Add
        </button>
      </div>

      {products.length === 0 && <p style={{ fontSize: '14px', color: '#999' }}>No products here yet.</p>}
      {products.map(p => (
        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid #eee', flexWrap: 'wrap', gap: '6px' }}>
          <div>
            <strong>{p.catalog_name}</strong>
            {p.variety_name && <span style={{ color: '#666' }}> ({p.variety_name})</span>}
            {' '}—{' '}
            {editingId === p.id ? (
              <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)}
                style={{ padding: '4px', width: '70px' }} />
            ) : (
              <span>€{p.price_per_kg}/kg</span>
            )}
            <span style={{ marginLeft: '8px', color: p.is_available ? 'green' : '#999' }}>
              {p.is_available ? '🟢' : '⚪'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {editingId === p.id ? (
              <>
                <button onClick={() => savePrice(p)}
                  style={{ padding: '4px 10px', background: '#2d6a4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                  Save
                </button>
                <button onClick={() => setEditingId(null)}
                  style={{ padding: '4px 10px', background: '#999', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={() => startPriceEdit(p)}
                  style={{ padding: '4px 10px', background: '#5a8f73', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                  € Edit
                </button>
                <button onClick={() => toggleActive(p)}
                  style={{ padding: '4px 10px', background: p.is_available ? '#999' : '#2d6a4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                  {p.is_available ? 'Off' : 'On'}
                </button>
                <button onClick={() => removeProduct(p)}
                  style={{ padding: '4px 10px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                  ✕
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProductManager;