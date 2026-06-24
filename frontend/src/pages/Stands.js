import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import Navbar from '../components/Navbar';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { API, FEATURES } from '../config';
import ProductManager from '../components/ProductManager';
import GetPaid from '../components/GetPaid';
import NotifyNearby from '../components/NotifyNearby';

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
      <div className="container-fluid py-3" style={{ background: '#f5f5f5' }}>
        <div className="row g-2 align-items-center">
          <div className="col-auto" style={{ minWidth: '300px' }}>
            <input
              className="form-control"
              placeholder="Stand name (e.g. Market stand Split)"
              value={standName}
              onChange={e => setStandName(e.target.value)}
            />
          </div>
          <div className="col-auto">
            <button onClick={handleSave} className="btn text-white" style={{ background: '#2d6a4f' }}>
              Save Stand
            </button>
          </div>
          {message && <div className="col-auto text-success">{message}</div>}
          {pin && <div className="col-auto text-muted small">📍 {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}</div>}
        </div>
      </div>
      <div className="container-fluid py-2 small" style={{ background: '#eef6f0' }}>
        👆 Click the map to set your stand location
      </div>
      <MapContainer center={[45.1, 16.5]} zoom={7} style={{ height: '35vh', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
        <LocationPicker onPick={setPin} />
        {pin && <Marker position={pin} />}
      </MapContainer>
      <div className="container py-3">
        <h3 className="mb-3">My Stands ({stands.length})</h3>
        {stands.length === 0 && <p className="text-muted">No stands yet. Click the map to add one!</p>}
        <div className="row g-3">
          {stands.map(s => (
            <div className="col-12" key={s.id}>
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                      {editingId === s.id ? (
                        <input className="form-control d-inline-block" style={{ width: '200px' }}
                          value={editName} onChange={e => setEditName(e.target.value)} />
                      ) : (
                        <strong>{s.name}</strong>
                      )}
                      <span className="text-muted small ms-2">
                        📍 {s.latitude?.toFixed(4)}, {s.longitude?.toFixed(4)}
                      </span>
                      <span className={`badge ms-2 ${s.is_active ? 'bg-success' : 'bg-secondary'}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="d-flex gap-2">
                      {editingId === s.id ? (
                        <>
                          <button onClick={() => saveEdit(s)} className="btn btn-sm text-white" style={{ background: '#2d6a4f' }}>
                            Save
                          </button>
                          <button onClick={() => setEditingId(null)} className="btn btn-sm btn-secondary">
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setExpandedStand(expandedStand === s.id ? null : s.id)}
                            className="btn btn-sm text-white" style={{ background: '#2d6a4f' }}>
                            {expandedStand === s.id ? 'Close' : 'Products'}
                          </button>
                          <button onClick={() => startEdit(s)} className="btn btn-sm text-white" style={{ background: '#5a8f73' }}>
                            Edit
                          </button>
                          <button onClick={() => deleteStand(s)} className="btn btn-sm btn-outline-danger">
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {expandedStand === s.id && (
                    <>
                      <ProductManager channelType="stand" channelId={s.id} />
                      <GetPaid channelType="stand" channelId={s.id} />
                      {FEATURES.notifications && <NotifyNearby channelType="stand" channelId={s.id} />}
                    </>
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

export default Stands;