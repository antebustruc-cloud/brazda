import React, { useState } from 'react';
import axios from 'axios';
import { API } from '../config';

// channelType is "stand", "parcel", or "delivery_event"; channelId is the id
function NotifyNearby({ channelType, channelId }) {
  const [radiusKm, setRadiusKm] = useState('3');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(null);
  const [error, setError] = useState('');
  const token = localStorage.getItem('access_token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const send = async () => {
    setError('');
    try {
      const res = await axios.post(`${API}/notifications/send/`, {
        channel_type: channelType,
        channel_id: channelId,
        radius_km: radiusKm,
        message,
      }, authHeader);
      setSent(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not send notification.');
    }
  };

  const reset = () => {
    setSent(null);
    setError('');
    setMessage('');
  };

  return (
    <div className="border-top mt-3 pt-3">
      <h6 style={{ color: '#2d6a4f' }}>Notify Nearby Buyers 📢</h6>
      {error && <div className="small text-danger mb-2">{error}</div>}

      {sent ? (
        <div>
          <div className="small text-success mb-2">
            Sent ✅ Buyers within {sent.radius_km}km will see this for the next 24h.
          </div>
          <button onClick={reset} className="btn btn-sm btn-secondary">Send another</button>
        </div>
      ) : (
        <div className="row g-2 align-items-center">
          <div className="col-auto">
            <div className="input-group">
              <span className="input-group-text">Radius</span>
              <input type="number" min="0.5" max="50" step="0.5" className="form-control" style={{ maxWidth: '80px' }}
                value={radiusKm} onChange={e => setRadiusKm(e.target.value)} />
              <span className="input-group-text">km</span>
            </div>
          </div>
          <div className="col-auto" style={{ minWidth: '220px' }}>
            <input className="form-control" placeholder="Optional message (e.g. Fresh tomatoes today!)"
              maxLength={200} value={message} onChange={e => setMessage(e.target.value)} />
          </div>
          <div className="col-auto">
            <button onClick={send} className="btn text-white" style={{ background: '#2d6a4f' }}>
              Send
            </button>
          </div>
        </div>
      )}
      <p className="small text-muted mt-2 mb-0">
        Free for now. Buyers see this on their Notifications page or when browsing nearby - it expires after 24h.
      </p>
    </div>
  );
}

export default NotifyNearby;
