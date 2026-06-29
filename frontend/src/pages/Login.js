import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API } from '../config';
import GoogleSignInButton from '../components/GoogleSignInButton';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { t } = useTranslation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post(`${API}/users/login/`, { email, password });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(t('login.error'));
    }
  };

  return (
    <div className="container" style={{ maxWidth: '420px', marginTop: '80px' }}>
      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <div className="text-center mb-1">
            <img src="/logo192.png" alt="Ubrano" style={{ height: '64px', width: '64px' }} />
          </div>
          <h2 className="text-center mb-1" style={{ color: '#2d6a4f', fontWeight: 'bold' }}>
            Ubrano
          </h2>
          <p className="text-center text-muted mb-4">{t('login.tagline')}</p>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label">{t('login.email')}</label>
              <input type="email" className="form-control" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="mb-3">
              <label className="form-label">{t('login.password')}</label>
              <input type="password" className="form-control" value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder={t('login.password')} />
            </div>
            <button type="submit" className="btn w-100 text-white" style={{ background: '#2d6a4f' }}>
              {t('login.submit')}
            </button>
          </form>

          <div className="d-flex align-items-center my-3">
            <hr className="flex-grow-1" />
            <span className="text-muted small mx-2">or</span>
            <hr className="flex-grow-1" />
          </div>
          <GoogleSignInButton />

          <p className="text-center mt-3 mb-0 text-muted">
            {t('login.noAccount')} <a href="/register" style={{ color: '#2d6a4f' }}>{t('login.register')}</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
