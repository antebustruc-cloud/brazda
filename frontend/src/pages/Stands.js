import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import Navbar from '../components/Navbar';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { API } from '../config';
import ProductManager from '../components/ProductManager';

function LocationPicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng);
    }
  });
  return null;
}

function Stands() {
  const [standName, setStandName] = useState('');
  const [pin, setPin] = useState(null);
  const [message, setMessage] = useState('');
  const [stands, setStands] = useState([]);
  const [expandedStand, setExpandedStand] = useState(null);
  const token = localStorage.getItem('access_token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchStands = async () => {
    try {
      const res = await axios.get(`${API}/stands/`, authHeader);
      setStands(res.data);
    } catch (err) {
      console.log('Could not load stands', err.response?.data);
    }
  };

  useEffect(() => {
    fetchStands();
  }, []);

  const handleSave = async () => {
    if (!standName || !pin) {
      setMessage('Please name the stand and drop a pin!');
      return;
    }
    try {
      await axios.post(`${API}/stands/`, {
        name: standName,
        lat: pin.lat,
        lng: pin.lng
      }, authHeader);
      setMessage('Stand saved! ✅');
      setStandName('');
      setPin(null);
      fetchStands();
    } catch (err) {
      setMessage('Error saving stand.');
      console.log(err.response?.data);
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ padding: '10px', background: '#f5f5f5', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          placeholder="Stand name (e.g. Market stand Split)"
          value={standName}
          onChange={e => setStandName(e.target.value)}
          style={{ padding: '8px', width: '300px' }}
        />
        <button onClick={handleSave}
          style={{ padding: '8px 16px', background: '#2d6a4f', color: 'white', border: 'none', cursor: 'pointer' }}>
          Save Stand
        </button>
        {message && <span style={{ color: '#2d6a4f' }}>{message}</span>}
        {pin && <span>📍 {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}</span>}
      </div>
      <p style={{ padding: '5px 10px', margin: 0, background: '#e8f5e9', fontSize: '14px' }}>
        👆 Click the map to set your stand location
      </p>
      <MapContainer center={[45.1, 16.5]} zoom={7} style={{ height: '60vh', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
        <LocationPicker onPick={setPin} />
        {pin && <Marker position={pin} />}
      </MapContainer>
      <div style={{ padding: '20px' }}>
        <h3>My Stands ({stands.length})</h3>
        {stands.length === 0 && <p>No stands yet. Click the map to add one!</p>}
       {stands.map(s => (
          <div key={s.id} style={{ border: '1px solid #ccc', padding: '12px', marginBottom: '8px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{s.name}</strong>
                <span style={{ color: '#666', marginLeft: '10px' }}>
                  📍 {s.latitude?.toFixed(4)}, {s.longitude?.toFixed(4)}
                </span>
                <span style={{ marginLeft: '10px', color: s.is_active ? 'green' : '#999' }}>
                  {s.is_active ? '🟢 Active' : '⚪ Inactive'}
                </span>
              </div>
              <button onClick={() => setExpandedStand(expandedStand === s.id ? null : s.id)}
                style={{ padding: '6px 14px', background: '#2d6a4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                {expandedStand === s.id ? 'Close' : 'Manage products'}
              </button>
            </div>
            {expandedStand === s.id && <ProductManager channelType="stand" channelId={s.id} />}
          </div>
        ))}
      </div>
    </>
  );
}

export default Stands;