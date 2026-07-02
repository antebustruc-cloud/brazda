import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../config';

/*
 * Embedded in My Stands — lets the stand owner ask OPG farmers
 * "can I sell your [product] on my stand?"
 * Approved relationships cause:
 * - The farmer's OPG rating to show on this product on the stand listing
 * - Any buyer rating for that product at this stand to route to the farming OPG
 */

function StandSupplierManager({ standId }) {
  const [requests, setRequests] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [form, setForm] = useState({ farmer: '', catalog_item: '' });
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('access_token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchRequests();
    fetchCatalog();
    fetchFarmers();
  }, [standId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API}/stands/supplier-requests/`, authHeader);
      setRequests(res.data.filter(r => r.stand === standId));
    } catch (err) { /* ignore */ }
  };

  const fetchCatalog = async () => {
    try {
      const res = await axios.get(`${API}/catalog/`, authHeader);
      const items = [];
      (res.data || []).forEach(cat => {
        if (cat.id) items.push({ id: cat.id, name: cat.name });
      });
      setCatalog(items);
    } catch (err) { /* ignore */ }
  };

  const fetchFarmers = async () => {
    try {
      // Get a list of OPGs from the nearby endpoints by fetching a very broad search
      // (simple approach — a dedicated /api/opgs/ endpoint would be cleaner later)
      const res = await axios.get(`${API}/parcels/nearby/?lat=45.0&lng=16.5&radius=500`, authHeader);
      const seen = {};
      const list = [];
      (res.data || []).forEach(p => {
        if (p.owner && !seen[p.owner]) {
          seen[p.owner] = true;
          list.push({ id: p.owner, name: p.opg_name });
        }
      });
      setFarmers(list);
    } catch (err) { /* ignore */ }
  };

  const sendRequest = async () => {
    if (!form.farmer || !form.catalog_item) {
      setMessage('Select a farmer and a product first.');
      return;
    }
    try {
      await axios.post(`${API}/stands/supplier-requests/`, {
        stand: standId,
        farmer: form.farmer,
        catalog_item: form.catalog_item,
      }, authHeader);
      setMessage('Request sent ✅');
      setForm({ farmer: '', catalog_item: '' });
      fetchRequests();
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Could not send request.');
    }
  };

  const STATUS_BADGE = {
    pending: 'bg-warning text-dark',
    accepted: 'bg-success',
    rejected: 'bg-secondary',
  };

  return (
    <div className="border-top mt-3 pt-3">
      <h6 style={{ color: '#2d6a4f' }}>Supplier Agreements</h6>
      <p className="small text-muted mb-2">
        Ask a farmer "can I sell your product on my stand?" Once they approve, their OPG rating
        appears on that product in your stand listing, and buyers' ratings route to them.
      </p>

      {message && <div className="small text-success mb-2">{message}</div>}

      <div className="row g-2 align-items-center mb-3">
        <div className="col-auto" style={{ minWidth: '180px' }}>
          <select className="form-select form-select-sm" value={form.farmer} onChange={e => setForm({ ...form, farmer: e.target.value })}>
            <option value="">-- Select farmer --</option>
            {farmers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div className="col-auto" style={{ minWidth: '160px' }}>
          <select className="form-select form-select-sm" value={form.catalog_item} onChange={e => setForm({ ...form, catalog_item: e.target.value })}>
            <option value="">-- Select product --</option>
            {catalog.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="col-auto">
          <button onClick={sendRequest} className="btn btn-sm text-white" style={{ background: '#2d6a4f' }}>
            Send request
          </button>
        </div>
      </div>

      {requests.length === 0 ? (
        <p className="small text-muted">No supply requests sent yet.</p>
      ) : (
        <table className="table table-sm">
          <thead>
            <tr><th>Farmer</th><th>Product</th><th>Status</th></tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id}>
                <td>{r.farmer_opg_name}</td>
                <td>{r.catalog_item_name}</td>
                <td>
                  <span className={`badge ${STATUS_BADGE[r.status] || 'bg-secondary'}`}>
                    {r.status}
                    {r.status === 'accepted' && r.farmer_opg_rating > 0 && ` · ★${r.farmer_opg_rating.toFixed(1)}`}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default StandSupplierManager;
