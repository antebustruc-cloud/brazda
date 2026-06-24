import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import { API } from '../config';

function Dashboard() {
  const [isSeller, setIsSeller] = useState(false);
  const token = localStorage.getItem('access_token');
  const { t } = useTranslation();

  useEffect(() => {
    axios.get(`${API}/users/profile/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setIsSeller(!!res.data.is_seller))
      .catch(() => setIsSeller(false));
  }, [token]);

  return (
    <>
      <Navbar />
      <div className="container" style={{ maxWidth: '900px', marginTop: '40px' }}>
        <div className="text-center mb-5">
          <h2 style={{ color: '#2d6a4f', fontWeight: 'bold' }}>{t('dashboard.welcome')}</h2>
          <p className="text-muted">{t('dashboard.tagline')}</p>
        </div>

        <div className="row g-4">
          <div className={isSeller ? 'col-md-6' : 'col-md-12'}>
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body text-center p-4">
                <h3 style={{ color: '#2d6a4f' }}>{t('dashboard.buyTitle')}</h3>
                <p className="text-muted">{t('dashboard.buyDesc')}</p>
                <a href="/buy-fields" className="btn text-white m-1" style={{ background: '#2d6a4f' }}>{t('nav.findFields')}</a>
                <a href="/buy-stands" className="btn text-white m-1" style={{ background: '#2d6a4f' }}>{t('nav.findStands')}</a>
                <a href="/buy-delivery" className="btn text-white m-1" style={{ background: '#2d6a4f' }}>{t('nav.findDelivery')}</a>
              </div>
            </div>
          </div>

          {isSeller && (
            <div className="col-md-6">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body text-center p-4">
                  <h3 style={{ color: '#2d6a4f' }}>{t('dashboard.sellTitle')}</h3>
                  <p className="text-muted">{t('dashboard.sellDesc')}</p>
                  <a href="/map" className="btn text-white m-1" style={{ background: '#2d6a4f' }}>{t('nav.myFields')}</a>
                  <a href="/stands" className="btn text-white m-1" style={{ background: '#2d6a4f' }}>{t('nav.myStands')}</a>
                  <a href="/delivery" className="btn text-white m-1" style={{ background: '#2d6a4f' }}>{t('nav.myDelivery')}</a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Dashboard;
