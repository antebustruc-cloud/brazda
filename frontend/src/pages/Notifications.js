import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import Navbar from '../components/Navbar';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { API } from '../config';

function LocationPicker({ onPick }) {
  useMapEvents({ click(e) { onPick(e.latlng); } });
  return null;
}

const CHANNEL_LABELS = {
  stand: '🧺 Stand',
  parcel: '🌾 Field',
  delivery_event: '🚚 Delivery',
};

function Notifications() {
  const [pin, setPin] = useState(null);
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('access_token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const useMyLocation = () => {
    if (!navigator.geolocation) { setMessage('GPS not available, tap the map instead.'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPin(p);
        fetchNearby(p);
      },
      () => setMessage('Could not get GPS, tap the map instead.')
    );
  };

  const fetchNearby = async (p) => {
    try {
      const res = await axios.get(`${API}/notifications/nearby/?lat=${p.lat}&lng=${p.lng}`, authHeader);
      setItems(res.data);
      setMessage(res.data.length === 0 ? 'Nothing nearby right now.' : '');
    } catch (err) {
      setMessage('Could not load notifications.');
    }
  };

  const onMapPick = (p) => {
    setPin(p);
    fetchNearby(p);
  };

  const markRead = async (id) => {
    try {
      await axios.post(`${API}/notifications/${id}/read/`, {}, authHeader);
      setItems(items.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      // non-critical, ignore
    }
  };

  return (
    <>
      <Navbar />
      <div className="container-fluid py-3" style={{ background: '#f5f5f5' }}>
        <div className="row g-2 align-items-center">
          <div className="col-auto">
            <button onClick={useMyLocation} className="btn text-white" style={{ background: '#2d6a4f' }}>
              📍 Use my location
            </button>
          </div>
          {message && <div className="col-auto text-muted">{message}</div>}
        </div>
        <div className="small text-muted mt-2">
          👆 Use GPS, or tap the map — shows farmer announcements ("we're open today!") near that spot.
        </div>
      </div>

      <MapContainer center={[45.1, 16.5]} zoom={7} style={{ height: '30vh', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
        <LocationPicker onPick={onMapPick} />
        {pin && <Marker position={pin} />}
      </MapContainer>

      <div className="container py-3">
        <h3 className="mb-3">Nearby Announcements ({items.length})</h3>
        <div className="row g-3">
          {items.map(n => (
            <div className="col-12" key={n.id}>
              <div className="card shadow-sm border-0" style={{ opacity: n.is_read ? 0.6 : 1 }}>
                <div className="card-body d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <span className="badge me-2" style={{ background: '#2d6a4f' }}>{CHANNEL_LABELS[n.channel_type] || n.channel_type}</span>
                    <strong>{n.channel_name}</strong>
                    <span className="text-muted small ms-2">{n.opg_name}</span>
                    {n.message && <div className="mt-1">{n.message}</div>}
                    <div className="text-muted small mt-1">📍 {n.distance_km}km away</div>
                  </div>
                  {!n.is_read && (
                    <button onClick={() => markRead(n.id)} className="btn btn-sm btn-outline-secondary">
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Notifications;
