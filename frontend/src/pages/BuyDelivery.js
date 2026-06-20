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

function BuyDelivery() {
  const [pin, setPin] = useState(null);
  const [events, setEvents] = useState([]);
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
        `${API}/delivery/nearby/?lat=${pin.lat}&lng=${pin.lng}`,
        authHeader
      );
      setEvents(res.data);
      setMessage(res.data.length === 0 ? 'No deliveries reach this location.' : '');
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
        <button onClick={search}
          style={{ padding: '8px 16px', background: '#2d6a4f', color: 'white', border: 'none', cursor: 'pointer' }}>
          Find deliveries to me
        </button>
        {message && <span style={{ color: '#2d6a4f' }}>{message}</span>}
      </div>
      <p style={{ padding: '5px 10px', margin: 0, background: '#e8f5e9', fontSize: '14px' }}>
        👆 Set where you want delivery (your home, or where you'll be). Shows deliveries whose range covers that spot.
      </p>
      <MapContainer center={[45.1, 16.5]} zoom={7} style={{ height: '45vh', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
        <LocationPicker onPick={setPin} />
        {pin && <Marker position={pin} />}
      </MapContainer>
      <div style={{ padding: '20px' }}>
        <h3>Deliveries available ({events.length})</h3>
        {events.map(ev => (
          <div key={ev.id} style={{ border: '1px solid #ccc', padding: '14px', marginBottom: '10px', borderRadius: '8px' }}>
            <strong>{ev.name}</strong> <span style={{ color: '#666' }}>by {ev.owner_username}</span>
            <div style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
              📅 {ev.delivery_date} · delivers within {ev.radius_km}km
            </div>
            <div style={{ marginTop: '8px' }}>
              {(!ev.products || ev.products.length === 0) && <span style={{ color: '#999' }}>No products listed.</span>}
              {ev.products && ev.products.map(p => (
                <div key={p.id} style={{ fontSize: '14px', padding: '2px 0' }}>
                  🚚 {p.catalog_name}{p.variety_name ? ` (${p.variety_name})` : ''} — €{p.price_per_kg}/kg
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default BuyDelivery;