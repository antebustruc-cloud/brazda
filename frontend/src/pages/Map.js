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

function Map() {
  const [parcelName, setParcelName] = useState('');
  const [pin, setPin] = useState(null);
  const [message, setMessage] = useState('');
  const [parcels, setParcels] = useState([]);
  const [expandedParcel, setExpandedParcel] = useState(null);
  const token = localStorage.getItem('access_token');

  const fetchParcels = async () => {
    try {
      const res = await axios.get(`${API}/parcels/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setParcels(res.data);
    } catch (err) {
      console.log('Could not load parcels', err.response?.data);
    }
  };

  useEffect(() => {
    fetchParcels();
  }, []);

  const handleSave = async () => {
    if (!parcelName || !pin) {
      setMessage('Please click on the map to drop a pin and enter a name!');
      return;
    }
    try {
      await axios.post(`${API}/parcels/`, {
        name: parcelName,
        lat: pin.lat,
        lng: pin.lng
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Parcel saved! ✅');
      setParcelName('');
      setPin(null);
      fetchParcels();
    } catch (err) {
      setMessage('Error saving parcel. Try again.');
      console.log(err.response?.data);
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ padding: '10px', background: '#f5f5f5', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          placeholder="Parcel name (e.g. Apple orchard)"
          value={parcelName}
          onChange={e => setParcelName(e.target.value)}
          style={{ padding: '8px', width: '300px' }}
        />
        <button onClick={handleSave}
          style={{ padding: '8px 16px', background: '#2d6a4f', color: 'white', border: 'none', cursor: 'pointer' }}>
          Save Parcel
        </button>
        {message && <span style={{ color: '#2d6a4f' }}>{message}</span>}
        {pin && <span>📍 {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}</span>}
      </div>
      <p style={{ padding: '5px 10px', margin: 0, background: '#e8f5e9', fontSize: '14px' }}>
        👆 Click anywhere on the map to drop a pin for your parcel entrance
      </p>
      <MapContainer center={[45.1, 16.5]} zoom={7} style={{ height: '82vh', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© OpenStreetMap contributors'
        />
        <LocationPicker onPick={setPin} />
        {pin && <Marker position={pin} />}
      </MapContainer>
      <div style={{ padding: '20px' }}>
        <h3>My Parcels ({parcels.length})</h3>
        {parcels.length === 0 && <p>No parcels yet. Click the map to add one!</p>}
        {parcels.map(p => (
          <div key={p.id} style={{ border: '1px solid #ccc', padding: '12px', marginBottom: '8px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{p.name}</strong>
                <span style={{ color: '#666', marginLeft: '10px' }}>
                  📍 {p.latitude?.toFixed(4)}, {p.longitude?.toFixed(4)}
                </span>
              </div>
              <button onClick={() => setExpandedParcel(expandedParcel === p.id ? null : p.id)}
                style={{ padding: '6px 14px', background: '#2d6a4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                {expandedParcel === p.id ? 'Close' : 'Manage products'}
              </button>
            </div>
            {expandedParcel === p.id && <ProductManager channelType="parcel" channelId={p.id} />}
          </div>
        ))}
      </div>
    </>
  );
}

export default Map;