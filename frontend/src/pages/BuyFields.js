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

function BuyFields() {
  const [pin, setPin] = useState(null);
  const [radius, setRadius] = useState(10);
  const [fields, setFields] = useState([]);
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
        `${API}/parcels/nearby/?lat=${pin.lat}&lng=${pin.lng}&radius=${radius}`,
        authHeader
      );
      const data = res.data.features ? res.data.features : res.data;
      setFields(data);
      setMessage(data.length === 0 ? 'No fields found in this area.' : '');
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

  const visibleFields = fields
    .map(f => ({ ...f, filtered: filterProducts(f.products) }))
    .filter(f => f.filtered.length > 0);

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
          Find fields near me
        </button>
        {message && <span style={{ color: '#2d6a4f' }}>{message}</span>}
      </div>

      {fields.length > 0 && (
        <div style={{ padding: '12px 15px', background: '#eef6f0', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
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
          <span style={{ fontSize: '13px', color: '#666' }}>{visibleFields.length} match</span>
        </div>
      )}

      <p style={{ padding: '5px 10px', margin: 0, background: '#e8f5e9', fontSize: '14px' }}>
        👆 Or click the map to search from a different spot
      </p>
      <MapContainer center={[45.1, 16.5]} zoom={7} style={{ height: '40vh', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
        <LocationPicker onPick={setPin} />
        {pin && <Marker position={pin} />}
        {visibleFields.map(f => (
          f.latitude && f.longitude ? <Marker key={f.id} position={[f.latitude, f.longitude]} /> : null
        ))}
      </MapContainer>
      <div style={{ padding: '20px' }}>
        <h3>Fields ({visibleFields.length})</h3>
        {visibleFields.map(f => (
          <div key={f.id} style={{ border: '1px solid #ccc', padding: '14px', marginBottom: '10px', borderRadius: '8px' }}>
            <strong>{f.name}</strong> <span style={{ color: '#666' }}>by {f.owner_username}</span>
            <span style={{ marginLeft: '10px', color: '#888', fontSize: '13px' }}>
              📍 {f.latitude?.toFixed(4)}, {f.longitude?.toFixed(4)}
            </span>
            <div style={{ marginTop: '8px' }}>
              {f.filtered.map(p => (
                <div key={p.id} style={{ fontSize: '14px', padding: '2px 0' }}>
                  🍎 {p.catalog_name}{p.variety_name ? ` (${p.variety_name})` : ''} — €{p.price_per_kg}/kg
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default BuyFields;