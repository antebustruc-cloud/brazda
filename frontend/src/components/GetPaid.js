import React, { useState } from 'react';
import axios from 'axios';
import { API } from '../config';

// channelType is "stand", "parcel", or "delivery_event"; channelId is the id
function GetPaid({ channelType, channelId }) {
  const [amount, setAmount] = useState('1.00');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [txn, setTxn] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const token = localStorage.getItem('access_token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const generate = async () => {
    setError('');
    setMessage('');
    try {
      const res = await axios.post(`${API}/payments/create/`, {
        amount,
        buyer_email: buyerEmail,
        channel_type: channelType,
        channel_id: channelId,
      }, authHeader);
      setTxn(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not generate barcode.');
    }
  };

  const confirmPaid = async () => {
    try {
      const res = await axios.patch(`${API}/payments/${txn.id}/confirm/`, {}, authHeader);
      setTxn(res.data);
      setMessage(res.data.buyer_email ? `Payment confirmed ✅ — receipt sent to ${res.data.buyer_email}` : 'Payment confirmed ✅');
    } catch (err) {
      setError('Could not confirm payment.');
    }
  };

  const reset = () => {
    setTxn(null);
    setMessage('');
    setError('');
    setAmount('1.00');
    setBuyerEmail('');
  };

  return (
    <div className="border-top mt-3 pt-3">
      <h6 style={{ color: '#2d6a4f' }}>Get Paid 💳</h6>
      {error && <div className="small text-danger mb-2">{error}</div>}
      {message && <div className="small text-success mb-2">{message}</div>}

      {!txn && (
        <div className="row g-2 align-items-center">
          <div className="col-auto">
            <div className="input-group">
              <span className="input-group-text">€</span>
              <input type="number" step="0.01" min="0.01" className="form-control" style={{ maxWidth: '100px' }}
                value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
          </div>
          <div className="col-auto">
            <input type="email" className="form-control" placeholder="Buyer email (optional, for receipt)"
              style={{ minWidth: '220px' }}
              value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} />
          </div>
          <div className="col-auto">
            <button onClick={generate} className="btn text-white" style={{ background: '#2d6a4f' }}>
              Generate barcode
            </button>
          </div>
        </div>
      )}

      {txn && (
        <div>
          <p className="small text-muted mb-2">
            Buyer scans this with their own m-banking app — they can adjust the amount there before confirming.
          </p>
          <img
            src={txn.barcode_image}
            alt="HUB-3A payment barcode"
            style={{ maxWidth: '100%', border: '1px solid #ddd', padding: '8px', background: '#fff' }}
          />
          <div className="mt-2 d-flex gap-2 align-items-center">
            {!txn.is_confirmed ? (
              <button onClick={confirmPaid} className="btn btn-sm text-white" style={{ background: '#2d6a4f' }}>
                Payment confirmed ✅
              </button>
            ) : (
              <span className="badge bg-success">Confirmed</span>
            )}
            <button onClick={reset} className="btn btn-sm btn-secondary">
              {txn.is_confirmed ? 'New barcode' : 'Cancel'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GetPaid;
