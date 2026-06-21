import React, { useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { API } from '../config';

function OPGLocationPicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng);
    }
  });
  return null;
}

function Register() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    is_buyer: true,
    is_seller: false,
    phone: ''
  });
  const [opg, setOpg] = useState({ opg_name: '', mibpg: '' });
  const [opgPin, setOpgPin] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleOpgChange = (e) => {
    setOpg({ ...opg, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    setError('');
    if (!form.email || !form.password) {
      setError('Email and password are required.');
      return;
    }
    const payload = { ...form };
    if (form.is_seller) {
      if (!form.phone) {
        setError('As a farmer you must enter a phone number so buyers can contact you.');
        return;
      }
      if (!opg.opg_name || !opg.mibpg || !opgPin) {
        setError('As a farmer you must enter OPG name, MIBPG, and drop your OPG pin on the map.');
        return;
      }
      payload.opg_name = opg.opg_name;
      payload.mibpg = opg.mibpg;
      payload.opg_lat = opgPin.lat;
      payload.opg_lng = opgPin.lng;
    }
    try {
      await axios.post(`${API}/users/register/`, payload);
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => window.location.href = '/', 2000);
    } catch (err) {
      setError('Registration failed. ' + JSON.stringify(err.response?.data || ''));
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', padding: '20px' }}>
      <h2>Join Ubrano 🌾</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <input name="email" type="email" placeholder="Email" onChange={handleChange}
        style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
      <input name="password" type="password" placeholder="Password" onChange={handleChange}
        style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
      <input name="phone" placeholder="Phone (e.g. 091 234 5678 or +385 91 234 5678)" onChange={handleChange}
        style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />

      <p style={{ marginBottom: '5px' }}>I am here as: *</p>
      <label style={{ display: 'block', marginBottom: '5px' }}>
        <input type="radio" name="role" value="buyer" required
          onChange={() => setForm({ ...form, is_buyer: true, is_seller: false })} /> Buyer only
      </label>
      <label style={{ display: 'block', marginBottom: '5px' }}>
        <input type="radio" name="role" value="seller"
          onChange={() => setForm({ ...form, is_buyer: false, is_seller: true })} /> Farmer/Seller only
      </label>
      <label style={{ display: 'block', marginBottom: '10px' }}>
        <input type="radio" name="role" value="both"
          onChange={() => setForm({ ...form, is_buyer: true, is_seller: true })} /> Both
      </label>

      {form.is_seller && (
        <div style={{ border: '1px solid #2d6a4f', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
          <h4>Your OPG details</h4>
          <input name="opg_name" placeholder="OPG name (e.g. OPG Bustruc)" onChange={handleOpgChange}
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
          <input name="mibpg" placeholder="MIBPG (your farm's unique number)" onChange={handleOpgChange}
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
          <p style={{ fontSize: '14px', margin: '5px 0' }}>📍 Click the map to set your OPG location (private):</p>
          <MapContainer center={[45.1, 16.5]} zoom={7} style={{ height: '250px', width: '100%', marginBottom: '10px' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
            <OPGLocationPicker onPick={setOpgPin} />
            {opgPin && <Marker position={opgPin} />}
          </MapContainer>
          {opgPin && <p style={{ fontSize: '13px', color: '#666' }}>Pin set: {opgPin.lat.toFixed(4)}, {opgPin.lng.toFixed(4)}</p>}
        </div>
      )}

      <button onClick={handleRegister}
        style={{ width: '100%', padding: '12px', background: 'green', color: 'white', border: 'none', cursor: 'pointer' }}>
        Register
      </button>
      <p style={{ textAlign: 'center', marginTop: '10px' }}>
        Already have an account? <a href="/">Login</a>
      </p>
    </div>
  );
}

export default Register;