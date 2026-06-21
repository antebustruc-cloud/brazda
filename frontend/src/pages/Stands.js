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
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
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

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditName(s.name);
  };

  const saveEdit = async (s) => {
    try {
      await axios.patch(`${API}/stands/${s.id}/`, { name: editName }, authHeader);
      setEditingId(null);
      fetchStands();
    } catch (err) {
      console.log('Edit error', err.response?.data);
    }
  };

  const deleteStand = async (s) => {
    if (!window.confirm(`Delete stand "${s.name}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/stands/${s.id}/`, authHeader);
      fetchStands();
    } catch (err) {
      console.log('Delete error', err.response?.data);
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
      <MapContainer center={[45.1, 16.5]} zoom={7} style={{ height: '35vh', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
        <LocationPicker onPick={setPin} />
        {pin && <Marker position={pin} />}
      </MapContainer>
      <div style={{ padding: '20px' }}>
        <h3 style={{ marginTop: 0 }}>My Stands ({stands.length})</h3>
        {stands.length === 0 && <p>No stands yet. Click the map to add one!</p>}
        {stands.map(s => (
          <div key={s.id} style={{ border: '1px solid #ccc', padding: '12px', marginBottom: '8px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                {editingId === s.id ? (
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    style={{ padding: '6px', width: '200px' }} />
                ) : (
                  <strong>{s.name}</strong>
                )}
                <span style={{ color: '#666', marginLeft: '10px' }}>
                  📍 {s.latitude?.toFixed(4)}, {s.longitude?.toFixed(4)}
                </span>
                <span style={{ marginLeft: '10px', color: s.is_active ? 'green' : '#999' }}>
                  {s.is_active ? '🟢 Active' : '⚪ Inactive'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {editingId === s.id ? (
                  <>
                    <button onClick={() => saveEdit(s)}
                      style={{ padding: '6px 12px', background: '#2d6a4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      Save
                    </button>
                    <button onClick={() => setEditingId(null)}
                      style={{ padding: '6px 12px', background: '#999', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setExpandedStand(expandedStand === s.id ? null : s.id)}
                      style={{ padding: '6px 12px', background: '#2d6a4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      {expandedStand === s.id ? 'Close' : 'Products'}
                    </button>
                    <button onClick={() => startEdit(s)}
                      style={{ padding: '6px 12px', background: '#5a8f73', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      Edit
                    </button>
                    <button onClick={() => deleteStand(s)}
                      style={{ padding: '6px 12px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
            {expandedStand === s.id && <ProductManager channelType="stand" channelId={s.id} />}
          </div>
        ))}
      </div>
    </>
  );
}

export default Stands;