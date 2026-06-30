import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../config';

function DeliveryLeads({ deliveryEventId, deliveryEventName }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('access_token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    axios.get(`${API}/notifications/delivery-leads/${deliveryEventId}/`, authHeader)
      .then(res => setLeads(res.data))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, [deliveryEventId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return null;

  return (
    <div className="border-top mt-3 pt-3">
      <h6 style={{ color: '#2d6a4f' }}>
        Interested buyers ({leads.length})
      </h6>
      {leads.length === 0 ? (
        <p className="text-muted small mb-0">
          No one has expressed interest in this delivery yet. Buyers who tap
          "I'm interested" on the Find Delivery page will appear here.
        </p>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id}>
                  <td>{l.buyer_name}</td>
                  <td>
                    {l.buyer_phone ? (
                      <a href={`tel:${l.buyer_phone}`} style={{ color: '#2d6a4f' }}>
                        {l.buyer_phone}
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="text-muted small">
                    {new Date(l.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DeliveryLeads;
