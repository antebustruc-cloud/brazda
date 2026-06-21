import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import Navbar from '../components/Navbar';
import ProductManager from '../components/ProductManager';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { API } from '../config';

function LocationPicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng);
    }
  });
  return null;
}

function Delivery() {
  const [form, setForm] = useState({ name: '', radius_km: '10', delivery_date: '' });
  const [pin, setPin] = useState(null);
  const [message, setMessage] = useState('');
  const [events, setEvents] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const token = localStorage.getItem('access_token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API}/delivery/`, authHeader);
      setEvents(res.data);
    } catch (err) {
      console.log('Could not load deliveries', err.response?.data);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!form.name || !form.delivery_date || !pin) {
      setMessage('Name, date, and a destination pin are required!');
      return;
    }
    try {
      await axios.post(`${API}/delivery/`, {
        name: form.name,
        radius_km: form.radius_km,
        delivery_date: form.delivery_date,
        lat: pin.lat,
        lng: pin.lng
      }, authHeader);
      setMessage('Delivery event saved! ✅');
      setForm({ name: '', radius_km: '10', delivery_date: '' });
      setPin(null);
      fetchEvents();
    } catch (err) {
      setMessage('Error saving delivery event.');
      console.log(err.response?.data);
    }
  };

  const startEdit = (ev) => {
    setEditingId(ev.id);
    setEditName(ev.name);
  };

  const saveEdit = async (ev) => {
    try {
      await axios.patch(`${API}/delivery/${ev.id}/`, { name: editName }, authHeader);
      setEditingId(null);
      fetchEvents();
    } catch (err) {
      console.log('Edit error', err.response?.data);
    }
  };

  const deleteEvent = async (ev) => {
    if (!window.confirm(`Delete delivery "${ev.name}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/delivery/${ev.id}/`, authHeader);
      fetchEvents();
    } catch (err) {
      console.log('Delete error', err.response?.data);
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ padding: '15px', background: '#f5f5f5' }}>
        <h3 style={{ marginTop: 0 }}>Create a Delivery Event 🚚</h3>
        <input name="name" placeholder="Event name (e.g. Tuesday Split run)" value={form.name}
          onChange={handleChange} style={{ padding: '8px', width: '250px', marginRight: '8px' }} />
        <label style={{ marginRight: '8px' }}>
          Date:
          <input name="delivery_date" type="date" value={form.delivery_date}
            onChange={handleChange} style={{ padding: '8px', marginLeft: '5px' }} />
        </label>
        <label style={{ marginRight: '8px' }}>
          Radius (km):
          <input name="radius_km" type="number" value={form.radius_km}
            onChange={handleChange} style={{ padding: '8px', width: '70px', marginLeft: '5px' }} />
        </label>

        <button onClick={handleSave}
          style={{ padding: '8px 16px', background: '#2d6a4f', color: 'white', border: 'none', cursor: 'pointer' }}>
          Save Delivery
        </button>
        {message && <span style={{ color: '#2d6a4f', marginLeft: '10px' }}>{message}</span>}
      </div>
      <p style={{ padding: '5px 10px', margin: 0, background: '#e8f5e9', fontSize: '14px' }}>
        👆 Click the map to set your delivery destination (e.g. Split center)
      </p>
      <MapContainer center={[45.1, 16.5]} zoom={7} style={{ height: '35vh', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
        <LocationPicker onPick={setPin} />
        {pin && <Marker position={pin} />}
      </MapContainer>
      <div style={{ padding: '20px' }}>
        <h3 style={{ marginTop: 0 }}>My Delivery Events ({events.length})</h3>
        {events.length === 0 && <p>No delivery events yet.</p>}
        {events.map(ev => (
          <div key={ev.id} style={{ border: '1px solid #ccc', padding: '12px', marginBottom: '8px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                {editingId === ev.id ? (
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    style={{ padding: '6px', width: '200px' }} />
                ) : (
                  <strong>{ev.name}</strong>
                )}
                <span style={{ color: '#666', marginLeft: '10px' }}>
                  📅 {ev.delivery_date} · {ev.radius_km}km radius
                </span>
                <span style={{ marginLeft: '10px', color: ev.is_active ? 'green' : '#999' }}>
                  {ev.is_active ? '🟢 Active' : '⚪ Inactive'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {editingId === ev.id ? (
                  <>
                    <button onClick={() => saveEdit(ev)}
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
                    <button onClick={() => setExpanded(expanded === ev.id ? null : ev.id)}
                      style={{ padding: '6px 12px', background: '#2d6a4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      {expanded === ev.id ? 'Close' : 'Products'}
                    </button>
                    <button onClick={() => startEdit(ev)}
                      style={{ padding: '6px 12px', background: '#5a8f73', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      Edit
                    </button>
                    <button onClick={() => deleteEvent(ev)}
                      style={{ padding: '6px 12px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
            {expanded === ev.id && <ProductManager channelType="delivery_event" channelId={ev.id} />}
          </div>
        ))}
      </div>
    </>
  );
}

export default Delivery;