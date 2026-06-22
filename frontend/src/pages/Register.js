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
    <div className="container" style={{ maxWidth: '520px', marginTop: '40px', marginBottom: '40px' }}>
      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <h2 className="text-center mb-1" style={{ color: '#2d6a4f', fontWeight: 'bold' }}>
            🌾 Join Ubrano
          </h2>
          <p className="text-center text-muted mb-4">Fresh from local farmers</p>

          {error && <div className="alert alert-danger py-2">{error}</div>}
          {success && <div className="alert alert-success py-2">{success}</div>}

          <div className="mb-3">
            <label className="form-label">Email</label>
            <input name="email" type="email" className="form-control"
              onChange={handleChange} placeholder="you@example.com" />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input name="password" type="password" className="form-control"
              onChange={handleChange} placeholder="Choose a password" />
          </div>
          <div className="mb-3">
            <label className="form-label">Phone</label>
            <input name="phone" className="form-control"
              onChange={handleChange} placeholder="091 234 5678 or +385 91 234 5678" />
          </div>

          <label className="form-label">I am here as:</label>
          <div className="mb-3">
            <div className="form-check">
              <input className="form-check-input" type="radio" name="role" id="roleBuyer"
                onChange={() => setForm({ ...form, is_buyer: true, is_seller: false })} />
              <label className="form-check-label" htmlFor="roleBuyer">Buyer only</label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="radio" name="role" id="roleSeller"
                onChange={() => setForm({ ...form, is_buyer: false, is_seller: true })} />
              <label className="form-check-label" htmlFor="roleSeller">Farmer / Seller only</label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="radio" name="role" id="roleBoth"
                onChange={() => setForm({ ...form, is_buyer: true, is_seller: true })} />
              <label className="form-check-label" htmlFor="roleBoth">Both</label>
            </div>
          </div>

          {form.is_seller && (
            <div className="card mb-3" style={{ borderColor: '#2d6a4f' }}>
              <div className="card-body">
                <h5 className="card-title">Your OPG details</h5>
                <div className="mb-2">
                  <input name="opg_name" className="form-control"
                    onChange={handleOpgChange} placeholder="OPG name (e.g. OPG Bustruc)" />
                </div>
                <div className="mb-2">
                  <input name="mibpg" className="form-control"
                    onChange={handleOpgChange} placeholder="MIBPG (your farm's unique number)" />
                </div>
                <p className="small mb-2">📍 Click the map to set your OPG location (private):</p>
                <MapContainer center={[45.1, 16.5]} zoom={7} style={{ height: '250px', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
                  <OPGLocationPicker onPick={setOpgPin} />
                  {opgPin && <Marker position={opgPin} />}
                </MapContainer>
                {opgPin && <p className="small text-muted mt-2 mb-0">Pin set: {opgPin.lat.toFixed(4)}, {opgPin.lng.toFixed(4)}</p>}
              </div>
            </div>
          )}

          <button onClick={handleRegister} className="btn w-100 text-white" style={{ background: '#2d6a4f' }}>
            Register
          </button>
          <p className="text-center mt-3 mb-0 text-muted">
            Already have an account? <a href="/" style={{ color: '#2d6a4f' }}>Log in</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
