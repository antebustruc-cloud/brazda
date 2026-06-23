import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { API } from '../config';

function OPGSettings() {
  const [opg, setOpg] = useState(null);
  const [iban, setIban] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const token = localStorage.getItem('access_token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    axios.get(`${API}/opg/`, authHeader).then(res => {
      setOpg(res.data);
      setIban(res.data.iban || '');
    }).catch(err => console.log('Load error', err.response?.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setMessage('');
    setError('');
    try {
      const res = await axios.patch(`${API}/opg/`, { iban }, authHeader);
      setOpg(res.data);
      setIban(res.data.iban || '');
      setMessage('Saved ✅');
    } catch (err) {
      setError(err.response?.data?.iban?.[0] || 'Could not save IBAN.');
    }
  };

  if (!opg) {
    return (
      <>
        <Navbar />
        <div className="container py-4">Loading...</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container py-4" style={{ maxWidth: '500px' }}>
        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            <h4 style={{ color: '#2d6a4f' }}>My OPG</h4>
            <p className="text-muted small mb-3">{opg.name} · MIBPG {opg.mibpg}</p>

            <label className="form-label">IBAN (for receiving payments)</label>
            <input
              className="form-control mb-2"
              placeholder="HR1210010051863000160"
              value={iban}
              onChange={e => setIban(e.target.value.toUpperCase())}
            />
            <div className="form-text mb-3">
              Used to generate your payment barcode. Never shown to buyers directly.
            </div>

            {error && <div className="alert alert-danger py-2">{error}</div>}
            {message && <div className="text-success small mb-2">{message}</div>}

            <button onClick={save} className="btn text-white" style={{ background: '#2d6a4f' }}>
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default OPGSettings;
