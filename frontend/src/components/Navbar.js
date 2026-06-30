import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API } from '../config';

function Navbar() {
  const [isSeller, setIsSeller] = useState(false);
  const token = localStorage.getItem('access_token');
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!token) return;
    axios.get(`${API}/users/profile/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setIsSeller(!!res.data.is_seller))
      .catch(() => setIsSeller(false));
  }, [token]);

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/';
  };

  const switchLang = (lng) => i18n.changeLanguage(lng);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark" style={{ background: '#2d6a4f' }}>
      <div className="container-fluid">
        <a className="navbar-brand fw-bold d-flex align-items-center gap-2" href="/dashboard">
          <img src="/logo192.png" alt="Ubrano" style={{ height: '28px', width: '28px' }} />
          Ubrano
        </a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="nav">
          <ul className="navbar-nav me-auto">
            {isSeller && (
              <>
                <li className="nav-item"><span className="nav-link text-white-50 small">{t('nav.sell')}</span></li>
                <li className="nav-item"><a className="nav-link" href="/opg">{t('nav.myOpg')}</a></li>
                <li className="nav-item"><a className="nav-link" href="/map">{t('nav.myFields')}</a></li>
                <li className="nav-item"><a className="nav-link" href="/stands">{t('nav.myStands')}</a></li>
                <li className="nav-item"><a className="nav-link" href="/delivery">{t('nav.myDelivery')}</a></li>
              </>
            )}
            <li className="nav-item"><span className="nav-link text-white-50 small">{t('nav.buy')}</span></li>
            <li className="nav-item"><a className="nav-link" href="/buy-fields">{t('nav.findFields')}</a></li>
            <li className="nav-item"><a className="nav-link" href="/buy-stands">{t('nav.findStands')}</a></li>
            <li className="nav-item"><a className="nav-link" href="/buy-delivery">{t('nav.findDelivery')}</a></li>
            <li className="nav-item"><a className="nav-link" href="/alert-zones" title="My alert zones">🔔</a></li>
          </ul>
          <div className="btn-group btn-group-sm me-2" role="group">
            <button onClick={() => switchLang('en')} className={`btn ${i18n.language === 'en' ? 'btn-light' : 'btn-outline-light'}`}>EN</button>
            <button onClick={() => switchLang('hr')} className={`btn ${i18n.language === 'hr' ? 'btn-light' : 'btn-outline-light'}`}>HR</button>
          </div>
          <button onClick={logout} className="btn btn-outline-light btn-sm">{t('nav.logout')}</button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
