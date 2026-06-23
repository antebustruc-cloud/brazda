import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import { API } from '../config';

// Wrap any seller-only page/route with this. Buyer-only accounts get a
// friendly message instead of a broken create form (the backend already
// rejects these requests with 403 - this is just the friendly frontend half).
function RequireSeller({ children }) {
  const [status, setStatus] = useState('loading'); // loading | seller | buyer
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    axios.get(`${API}/users/profile/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setStatus(res.data.is_seller ? 'seller' : 'buyer'))
      .catch(() => setStatus('buyer'));
  }, [token]);

  if (status === 'loading') {
    return (
      <>
        <Navbar />
        <div className="container py-4">Loading...</div>
      </>
    );
  }

  if (status === 'buyer') {
    return (
      <>
        <Navbar />
        <div className="container py-4" style={{ maxWidth: '500px' }}>
          <div className="alert alert-warning">
            This page is for sellers (farmers) only — your account is registered as a buyer.
          </div>
        </div>
      </>
    );
  }

  return children;
}

export default RequireSeller;
