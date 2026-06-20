import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { API } from '../config';

function Products() {
  const [parcels, setParcels] = useState([]);
  const [products, setProducts] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    catalog_item: '',
    variety: '',
    description: '',
    price_per_kg: '',
    parcel: ''
  });
  const token = localStorage.getItem('access_token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchData = async () => {
    try {
      const parcelRes = await axios.get(`${API}/parcels/`, authHeader);
      setParcels(parcelRes.data);
      const productRes = await axios.get(`${API}/products/`, authHeader);
      setProducts(productRes.data);
      const catalogRes = await axios.get(`${API}/catalog/`, authHeader);
      setCatalog(catalogRes.data);
    } catch (err) {
      console.log('Load error', err.response?.data);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Find the selected catalog item to show its varieties
  const selectedCatalog = catalog.find(c => String(c.id) === String(form.catalog_item));

  const handleSubmit = async () => {
    if (!form.catalog_item || !form.price_per_kg || !form.parcel) {
      setMessage('Product, price and parcel are required!');
      return;
    }
    try {
      const payload = {
        catalog_item: form.catalog_item,
        variety: form.variety || null,
        description: form.description,
        price_per_kg: form.price_per_kg,
        parcel: form.parcel
      };
      await axios.post(`${API}/products/`, payload, authHeader);
      setMessage('Product added! ✅');
      setForm({ catalog_item: '', variety: '', description: '', price_per_kg: '', parcel: '' });
      fetchData();
    } catch (err) {
      setMessage('Error adding product.');
      console.log(err.response?.data);
    }
  };

  const toggleActive = async (product) => {
    try {
      await axios.patch(`${API}/products/${product.id}/`,
        { is_available: !product.is_available },
        authHeader
      );
      fetchData();
    } catch (err) {
      console.log('Toggle error', err.response?.data);
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: '700px', margin: '20px auto', padding: '20px' }}>
        <h2>Add a Product 🍎</h2>
        {message && <p style={{ color: '#2d6a4f' }}>{message}</p>}

        <select name="parcel" value={form.parcel} onChange={handleChange}
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}>
          <option value="">-- Select a parcel --</option>
          {parcels.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select name="catalog_item" value={form.catalog_item} onChange={handleChange}
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}>
          <option value="">-- Select a product --</option>
          {catalog.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {selectedCatalog && selectedCatalog.varieties.length > 0 && (
          <select name="variety" value={form.variety} onChange={handleChange}
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}>
            <option value="">-- Variety (optional) --</option>
            {selectedCatalog.varieties.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        )}

        <textarea name="description" placeholder="Description" value={form.description}
          onChange={handleChange} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />

        <input name="price_per_kg" type="number" placeholder="Price per kg (€)" value={form.price_per_kg}
          onChange={handleChange} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />

        <button onClick={handleSubmit}
          style={{ width: '100%', padding: '12px', background: '#2d6a4f', color: 'white', border: 'none', cursor: 'pointer' }}>
          Add Product
        </button>

        <h3 style={{ marginTop: '30px' }}>My Products ({products.length})</h3>
        {products.map(p => (
          <div key={p.id} style={{ border: '1px solid #ccc', padding: '12px', marginBottom: '8px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{p.catalog_name}</strong>
              {p.variety_name && <span style={{ color: '#666' }}> ({p.variety_name})</span>}
              {' '}— €{p.price_per_kg}/kg
              <span style={{ marginLeft: '10px', color: p.is_available ? 'green' : '#999' }}>
                {p.is_available ? '🟢 Active' : '⚪ Inactive'}
              </span>
            </div>
            <button onClick={() => toggleActive(p)}
              style={{
                padding: '6px 14px',
                background: p.is_available ? '#999' : '#2d6a4f',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
              {p.is_available ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

export default Products;