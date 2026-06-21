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

  const filterProducts = (products) => {
    if (!products) return [];
    return products.filter(p => {
      if (fName && !p.catalog_name.toLowerCase().includes(fName.toLowerCase())) return false;
      if (fMaxPrice && parseFloat(p.price_per_kg) > parseFloat(fMaxPrice)) return false;
      if (fType && p.category !== fType) return false;
      return true;
    });
  };

  const visibleEvents = events
    .map(ev => ({ ...ev, filtered: filterProducts(ev.products) }))
    .filter(ev => ev.filtered.length > 0);

  return (
    <>
      <Navbar />
      <div style={{ padding: '12px 15px', background: '#f5f5f5', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
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

      {events.length > 0 && (
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
          <span style={{ fontSize: '13px', color: '#666' }}>{visibleEvents.length} match</span>
        </div>
      )}

      <MapContainer center={[45.1, 16.5]} zoom={7} style={{ height: '30vh', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
        <LocationPicker onPick={setPin} />
        {pin && <Marker position={pin} />}
      </MapContainer>
      <div style={{ padding: '15px' }}>
        <h3 style={{ marginTop: 0 }}>Deliveries available ({visibleEvents.length})</h3>
        {visibleEvents.map(ev => (
          <div key={ev.id} style={{ border: '1px solid #ccc', padding: '14px', marginBottom: '10px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <strong>{ev.name}</strong> <span style={{ color: '#666' }}>· {ev.opg_name}</span>
                <div style={{ color: '#888', fontSize: '13px', marginTop: '2px' }}>
                  📅 {ev.delivery_date} · delivers within {ev.radius_km}km
                </div>
                {ev.owner_phone && (
                  <div style={{ fontSize: '14px', marginTop: '4px' }}>📞 {ev.owner_phone}</div>
                )}
              </div>
              {ev.owner_phone && (
                <a href={`tel:${ev.owner_phone}`}
                  style={{ padding: '8px 14px', background: '#2d6a4f', color: 'white', borderRadius: '4px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  📞 Call
                </a>
              )}
            </div>
            <div style={{ marginTop: '8px' }}>
              {ev.filtered.map(p => (
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