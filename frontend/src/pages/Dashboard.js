import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';

import { API } from '../config';

function Dashboard() {
  const [products, setProducts] = useState([]);
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    axios.get(`${API}/products/`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setProducts(res.data));
  }, [token]);

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
        <h2>Welcome to Brazda 🌾</h2>
        <h3>Available Products</h3>
        {products.map(p => (
          <div key={p.id} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '10px', borderRadius: '8px' }}>
            <h4>{p.name} — €{p.price_per_kg}/kg</h4>
            <p>{p.description}</p>
            <p>Ready: {p.ready_from} → {p.ready_until}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export default Dashboard;