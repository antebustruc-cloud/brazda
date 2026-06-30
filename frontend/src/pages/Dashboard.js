import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import RatingSurveyModal from '../components/RatingSurveyModal';
import { API } from '../config';

function StarPicker({ value, onChange }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: n <= value ? '#e6a817' : '#ccc', padding: '0 2px' }}>
          ★
        </button>
      ))}
    </span>
  );
}

function BuyerRatingQueue() {
  const [pending, setPending] = useState([]);
  const [scores, setScores] = useState({});
  const [submitted, setSubmitted] = useState({});
  const token = localStorage.getItem('access_token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    axios.get(`${API}/ratings/buyer/`, authHeader)
      .then(res => setPending(res.data))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (buyerId) => {
    const score = scores[buyerId];
    if (!score) return;
    try {
      await axios.post(`${API}/ratings/buyer/`, { buyer: buyerId, score }, authHeader);
      setSubmitted(prev => ({ ...prev, [buyerId]: true }));
    } catch (err) {
      console.log('Buyer rating error', err.response?.data);
    }
  };

  const unrated = pending.filter(p => !submitted[p.buyer_id]);
  if (unrated.length === 0) return null;

  return (
    <div className="col-12 mt-2">
      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <h5 style={{ color: '#2d6a4f' }}>Rate your buyers ({unrated.length})</h5>
          <p className="text-muted small mb-3">These buyers expressed interest more than 48h ago. Rate them so others know who's reliable.</p>
          <div className="row g-2">
            {unrated.map(p => (
              <div className="col-md-6" key={`${p.interest_type}-${p.interest_id}`}>
                <div className="border rounded p-3">
                  <div className="fw-semibold">{p.buyer_name}</div>
                  <div className="text-muted small">{p.channel_name} · {new Date(p.interested_at).toLocaleDateString()}</div>
                  {p.buyer_phone && <div className="small">📞 <a href={`tel:${p.buyer_phone}`} style={{ color: '#2d6a4f' }}>{p.buyer_phone}</a></div>}
                  <div className="mt-2 d-flex align-items-center gap-2">
                    <StarPicker value={scores[p.buyer_id] || 0} onChange={v => setScores(prev => ({ ...prev, [p.buyer_id]: v }))} />
                    <button onClick={() => submit(p.buyer_id)} disabled={!scores[p.buyer_id]}
                      className="btn btn-sm text-white" style={{ background: '#2d6a4f' }}>
                      Rate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

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
      <RatingSurveyModal />
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
          {isSeller && <BuyerRatingQueue />}
        </div>
      </div>
    </>
  );
}

export default Dashboard;
