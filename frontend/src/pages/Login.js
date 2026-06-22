import React, { useState } from 'react';
import axios from 'axios';
import { API } from '../config';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post(`${API}/users/login/`, { email, password });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      window.location.href = '/dashboard';
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '420px', marginTop: '80px' }}>
      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <h2 className="text-center mb-1" style={{ color: '#2d6a4f', fontWeight: 'bold' }}>
            🌾 Ubrano
          </h2>
          <p className="text-center text-muted mb-4">Fresh from local farmers</p>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
            </div>
            <button type="submit" className="btn w-100 text-white" style={{ background: '#2d6a4f' }}>
              Log In
            </button>
          </form>
          <p className="text-center mt-3 mb-0 text-muted">
            Don't have an account? <a href="/register" style={{ color: '#2d6a4f' }}>Register</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
