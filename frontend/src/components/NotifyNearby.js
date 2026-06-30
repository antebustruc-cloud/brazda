import React, { useState } from 'react';
import axios from 'axios';
import { API } from '../config';

// channelType is "stand", "parcel", or "delivery_event"; channelId is the id
function NotifyNearby({ channelType, channelId }) {
  const [radiusKm, setRadiusKm] = useState('3');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState('');
  const token = localStorage.getItem('access_token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const submit = async () => {
    setError('');
    try {
      const res = await axios.post(`${API}/notifications/requests/`, {
        channel_type: channelType,
        channel_id: channelId,
        radius_km: radiusKm,
        message,
      }, authHeader);
      setSubmitted(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not submit notification request.');
    }
  };

  const reset = () => {
    setSubmitted(null);
    setError('');
    setMessage('');
  };

  return (
    <div className="border-top mt-3 pt-3">
      <h6 style={{ color: '#2d6a4f' }}>Notify Nearby Buyers 📢</h6>
      <p className="small text-muted mb-2">
        Your request will be reviewed and sent to buyers whose saved alert zones fall within your chosen radius.
        You will be able to see how many buyers were matched and reached.
      </p>
      {error && <div className="small text-danger mb-2">{error}</div>}

      {submitted ? (
        <div>
          <div className="small text-success mb-2">
            Request submitted ✅ — it will be reviewed shortly.
            Status: <strong>{submitted.status}</strong>
          </div>
          <button onClick={reset} className="btn btn-sm btn-secondary">Send another</button>
        </div>
      ) : (
        <div className="row g-2 align-items-center">
          <div className="col-auto">
            <div className="input-group">
              <span className="input-group-text">Radius</span>
              <input
                type="number" min="0.5" max="50" step="0.5"
                className="form-control" style={{ maxWidth: '80px' }}
                value={radiusKm} onChange={e => setRadiusKm(e.target.value)}
              />
              <span className="input-group-text">km</span>
            </div>
          </div>
          <div className="col-auto" style={{ minWidth: '240px' }}>
            <input
              className="form-control"
              placeholder="Optional message (e.g. Fresh tomatoes today!)"
              maxLength={200}
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>
          <div className="col-auto">
            <button onClick={submit} className="btn text-white" style={{ background: '#2d6a4f' }}>
              Submit request
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotifyNearby;
