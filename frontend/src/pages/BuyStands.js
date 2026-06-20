import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import Navbar from '../components/Navbar';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { API } from '../config';

function LocationPicker({ onPick }) {
  useMapEvents({
    click(e) { onPick(e.latlng); }
  });
  return null;
}

function BuyStands() {
  const [pin, setPin] = useState(null);
  const [radius, setRadius] = useState(10);
  const [stands, setStands] = useState([]);
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('access_token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setMessage('GPS not available, click the map instead.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setPin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setMessage('Could not get GPS, click the map instead.')
    );
  };

  const search = async () => {
    if (!pin) {
      setMessage('Set your location first (GPS or click the map).');
      return;
    }
    try {
      const res = await axios.get(
        `${API}/stands/nearby/?lat=${pin.lat}&lng=${pin.lng}&radius=${radius}`,
        authHeader
      );
      setStands(res.data);
      setMessage(res.data.length === 0 ? 'No stands found in this area.' : '');
    } catch (err) {
      setMessage('Search error.');
      console.log(err.response?.data);
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ padding: '15px', background: '#f5f5f5', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={useMyLocation}
          style={{ padding: '8px 14px', background: '#2d6a4f', color: 'white', border: 'none', cursor: 'pointer' }}>
          📍 Use my location
        </button>
        <label>Radius (km):
          <input type="number" value={radius} onChange={e => setRadius(e.target.value)}
            style={{ padding: '8px', width: '70px', marginLeft: '5px' }} />
        </label>
        <button onClick={search}
          style={{ padding: '8px 16px', background: '#2d6a4f', color: 'white', border: 'none', cursor: 'pointer' }}>
          Find stands near me
        </button>
        {message && <span style={{ color: '#2d6a4f' }}>{message}</span>}
      </div>
      <p style={{ padding: '5px 10px', margin: 0, background: '#e8f5e9', fontSize: '14px' }}>
        👆 Or click the map to search from a different spot (e.g. where you're going tomorrow)
      </p>
      <MapContainer center={[45.1, 16.5]} zoom={7} style={{ height: '45vh', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
        <LocationPicker onPick={setPin} />
        {pin && <Marker position={pin} />}
      </MapContainer>
      <div style={{ padding: '20px' }}>
        <h3>Stands found ({stands.length})</h3>
        {stands.map(s => (
          <div key={s.id} style={{ border: '1px solid #ccc', padding: '14px', marginBottom: '10px', borderRadius: '8px' }}>
            <strong>{s.name}</strong> <span style={{ color: '#666' }}>by {s.owner_username}</span>
            <div style={{ marginTop: '8px' }}>
              {s.products.length === 0 && <span style={{ color: '#999' }}>No products listed.</span>}
              {s.products.map(p => (
                <div key={p.id} style={{ fontSize: '14px', padding: '2px 0' }}>
                  🥬 {p.catalog_name}{p.variety_name ? ` (${p.variety_name})` : ''} — €{p.price_per_kg}/kg
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default BuyStands;