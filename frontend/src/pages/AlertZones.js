import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import Navbar from '../components/Navbar';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { API } from '../config';

function LocationPicker({ onPick }) {
  useMapEvents({ click(e) { onPick(e.latlng); } });
  return null;
}

function AlertZones() {
  const [zones, setZones] = useState([]);
  const [pin, setPin] = useState(null);
  const [label, setLabel] = useState('');
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('access_token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchZones = async () => {
    try {
      const res = await axios.get(`${API}/notifications/alert-zones/`, authHeader);
      setZones(res.data);
    } catch (err) {
      console.log('Could not load alert zones', err.response?.data);
    }
  };

  useEffect(() => { fetchZones(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addZone = async () => {
    if (!label.trim() || !pin) {
      setMessage('Enter a label and tap the map to drop a pin.');
      return;
    }
    try {
      await axios.post(`${API}/notifications/alert-zones/`, {
        label: label.trim(), lat: pin.lat, lng: pin.lng,
      }, authHeader);
      setMessage('Alert zone saved ✅');
      setLabel('');
      setPin(null);
      fetchZones();
    } catch (err) {
      setMessage('Could not save alert zone.');
    }
  };

  const deleteZone = async (id) => {
    try {
      await axios.delete(`${API}/notifications/alert-zones/${id}/`, authHeader);
      fetchZones();
    } catch (err) {
      setMessage('Could not delete alert zone.');
    }
  };

  return (
    <>
      <Navbar />
      <div className="container-fluid py-3" style={{ background: '#f5f5f5' }}>
        <h5 style={{ color: '#2d6a4f' }}>My Alert Zones 📍</h5>
        <p className="text-muted small mb-3">
          Set locations where you want to be notified when a nearby farmer announces something.
          When a farmer sends a notification, you'll receive it if any of your alert zones is within their range.
        </p>
        <div className="row g-2 align-items-center">
          <div className="col-auto">
            <input
              className="form-control"
              placeholder="Label (e.g. Home, Work, Split centre)"
              value={label}
              onChange={e => setLabel(e.target.value)}
              style={{ minWidth: '240px' }}
            />
          </div>
          <div className="col-auto">
            <button onClick={addZone} className="btn text-white" style={{ background: '#2d6a4f' }}>
              Save zone
            </button>
          </div>
          {message && <div className="col-auto text-success small">{message}</div>}
        </div>
        <div className="small text-muted mt-2">👆 Tap the map to pin the location for this zone.</div>
      </div>

      <MapContainer center={[45.1, 16.5]} zoom={7} style={{ height: '35vh', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
        <LocationPicker onPick={setPin} />
        {pin && <Marker position={pin} />}
        {zones.map(z => (
          <Marker key={z.id} position={{ lat: z.lat, lng: z.lng }} />
        ))}
      </MapContainer>

      <div className="container py-3">
        <h5 className="mb-3">Saved zones ({zones.length})</h5>
        {zones.length === 0 && (
          <p className="text-muted">No alert zones yet. Tap the map above to add one.</p>
        )}
        <div className="row g-2">
          {zones.map(z => (
            <div className="col-12" key={z.id}>
              <div className="card shadow-sm border-0">
                <div className="card-body d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{z.label}</strong>
                    <span className="text-muted small ms-2">
                      📍 {z.lat.toFixed(4)}, {z.lng.toFixed(4)}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteZone(z.id)}
                    className="btn btn-sm btn-outline-danger"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default AlertZones;
