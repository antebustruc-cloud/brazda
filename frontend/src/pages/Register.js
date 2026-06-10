import React, { useState } from 'react';
import axios from 'axios';

const API = 'http://192.168.0.14:8000/api';

function Register() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    is_seller: false,
    is_buyer: true,
    phone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/users/register/`, form);
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => window.location.href = '/', 2000);
    } catch (err) {
      setError('Registration failed. Try a different username.');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <h2>Join Brazda 🌾</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
      <form onSubmit={handleRegister}>
        <input name="username" placeholder="Username" onChange={handleChange}
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
        <input name="email" type="email" placeholder="Email" onChange={handleChange}
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
        <input name="password" type="password" placeholder="Password" onChange={handleChange}
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
        <input name="phone" placeholder="Phone (optional)" onChange={handleChange}
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
        <button type="submit"
          style={{ width: '100%', padding: '10px', background: 'green', color: 'white' }}>
          Register
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '10px' }}>
        Already have an account? <a href="/">Login</a>
      </p>
    </div>
  );
}

export default Register;