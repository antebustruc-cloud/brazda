import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { API } from '../config';

const STATUS_BADGE = {
  pending: 'bg-warning text-dark',
  accepted: 'bg-success',
  rejected: 'bg-secondary',
};

function IncomingSupplyRequests() {
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('access_token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API}/stands/incoming-requests/`, authHeader);
      setRequests(res.data);
    } catch (err) {
      console.log('Could not load requests', err.response?.data);
    }
  };

  useEffect(() => { fetchRequests(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const respond = async (id, status) => {
    try {
      await axios.patch(`${API}/stands/incoming-requests/${id}/`, { status }, authHeader);
      setMessage(`Request ${status} ✅`);
      fetchRequests();
    } catch (err) {
      setMessage('Could not update request.');
    }
  };

  const pending = requests.filter(r => r.status === 'pending');
  const decided = requests.filter(r => r.status !== 'pending');

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <h4 style={{ color: '#2d6a4f' }}>Incoming supply requests</h4>
        <p className="text-muted">
          Stand owners asking to sell your products. Approve to let them — your OPG rating
          will appear on that product in their stand listing.
        </p>

        {message && <div className="alert alert-success py-2 mb-3">{message}</div>}

        {pending.length === 0 && decided.length === 0 && (
          <p className="text-muted">No supply requests yet.</p>
        )}

        {pending.length > 0 && (
          <>
            <h6 className="mb-2">Pending ({pending.length})</h6>
            <div className="row g-3 mb-4">
              {pending.map(r => (
                <div className="col-md-6" key={r.id}>
                  <div className="card shadow-sm border-0">
                    <div className="card-body">
                      <div className="fw-bold">{r.stand_name}</div>
                      <div className="text-muted small mb-2">
                        Wants to sell your <strong>{r.catalog_item_name}</strong>
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          onClick={() => respond(r.id, 'accepted')}
                          className="btn btn-sm text-white"
                          style={{ background: '#2d6a4f' }}
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => respond(r.id, 'rejected')}
                          className="btn btn-sm btn-outline-secondary"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {decided.length > 0 && (
          <>
            <h6 className="mb-2">Decided</h6>
            <table className="table table-sm">
              <thead>
                <tr><th>Stand</th><th>Product</th><th>Status</th></tr>
              </thead>
              <tbody>
                {decided.map(r => (
                  <tr key={r.id}>
                    <td>{r.stand_name}</td>
                    <td>{r.catalog_item_name}</td>
                    <td><span className={`badge ${STATUS_BADGE[r.status]}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </>
  );
}

export default IncomingSupplyRequests;
