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
  const [fType, setFType] = useState('');
  const [fName, setFName] = useState('');
  const [fMaxPrice, setFMaxPrice] = useState('');

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

  const filterProducts = (products) => {
    if (!products) return [];
    return products.filter(p => {
      if (fName && !p.catalog_name.toLowerCase().includes(fName.toLowerCase())) return false;
      if (fMaxPrice && parseFloat(p.price_per_kg) > parseFloat(fMaxPrice)) return false;
      if (fType && p.category !== fType) return false;
      return true;
    });
  };

  const visibleStands = stands
    .map(s => ({ ...s, filtered: filterProducts(s.products) }))
    .filter(s => s.filtered.length > 0);

  return (
    <>
      <Navbar />
      <div style={{ padding: '12px 15px', background: '#f5f5f5', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
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

      {stands.length > 0 && (
        <div style={{ padding: '10px 15px', background: '#eef6f0', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <strong style={{ fontSize: '14px' }}>Filter:</strong>
          <input placeholder="Product (e.g. apple)" value={fName} onChange={e => setFName(e.target.value)}
            style={{ padding: '6px', width: '150px' }} />
          <select value={fType} onChange={e => setFType(e.target.value)} style={{ padding: '6px' }}>
            <option value="">Any type</option>
            <option value="fruit">Fruit</option>
            <option value="vegetable">Vegetable</option>
            <option value="herb">Herb</option>
            <option value="other">Other</option>
          </select>
          <label style={{ fontSize: '14px' }}>Max €/kg:
            <input type="number" value={fMaxPrice} onChange={e => setFMaxPrice(e.target.value)}
              style={{ padding: '6px', width: '80px', marginLeft: '5px' }} />
          </label>
          <span style={{ fontSize: '13px', color: '#666' }}>{visibleStands.length} match</span>
        </div>
      )}

      <MapContainer center={[45.1, 16.5]} zoom={7} style={{ height: '30vh', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
        <LocationPicker onPick={setPin} />
        {pin && <Marker position={pin} />}
      </MapContainer>
      <div style={{ padding: '15px' }}>
        <h3 style={{ marginTop: 0 }}>Stands ({visibleStands.length})</h3>
        {visibleStands.map(s => (
          <div key={s.id} style={{ border: '1px solid #ccc', padding: '14px', marginBottom: '10px', borderRadius: '8px' }}>
            <strong>{s.name}</strong> <span style={{ color: '#666' }}>· {s.opg_name}</span>
            <div style={{ marginTop: '8px' }}>
              {s.filtered.map(p => (
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