import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import Navbar from '../components/Navbar';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { API } from '../config';

function LocationPicker({ onPick }) {
  useMapEvents({ click(e) { onPick(e.latlng); } });
  return null;
}

function BuyFields() {
  const { t } = useTranslation();
  const [pin, setPin] = useState(null);
  const [radius, setRadius] = useState(10);
  const [fields, setFields] = useState([]);
  const [message, setMessage] = useState('');
  const [fType, setFType] = useState('');
  const [fName, setFName] = useState('');
  const [fMaxPrice, setFMaxPrice] = useState('');
  const [interested, setInterested] = useState({});

  const token = localStorage.getItem('access_token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const expressInterest = async (fieldId) => {
    try {
      await axios.post(`${API}/ratings/field-interest/${fieldId}/`, {}, authHeader);
      setInterested(prev => ({ ...prev, [fieldId]: true }));
    } catch (err) {
      console.log('Interest error', err.response?.data);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) { setMessage(t('buy.gpsNotAvailable')); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setPin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setMessage(t('buy.gpsError'))
    );
  };

  const search = async () => {
    if (!pin) { setMessage(t('buy.setLocationFirst')); return; }
    try {
      const res = await axios.get(`${API}/parcels/nearby/?lat=${pin.lat}&lng=${pin.lng}&radius=${radius}`, authHeader);
      const data = res.data.features ? res.data.features : res.data;
      setFields(data);
      setMessage(data.length === 0 ? t('buyFields.noResults') : '');
    } catch (err) {
      setMessage(t('buy.searchError'));
      console.log(err.response?.data);
    }
  };

  const filterProducts = (products) => {
    if (!products) return [];
    return products.filter(p => {
      if (fName && !p.catalog_name.toLowerCase().includes(fName.toLowerCase())) return false;
      if (fMaxPrice && parseFloat(p.price_per_kg) > parseFloat(fMaxPrice)) return false;
      if (fType && p.category !== fType) return false;
      return true;
    });
  };

  const visibleFields = fields
    .map(f => ({ ...f, filtered: filterProducts(f.products) }))
    .filter(f => f.filtered.length > 0);

  return (
    <>
      <Navbar />
      <div className="container-fluid py-3" style={{ background: '#f5f5f5' }}>
        <div className="row g-2 align-items-center">
          <div className="col-auto">
            <button onClick={useMyLocation} className="btn text-white" style={{ background: '#2d6a4f' }}>{t('buy.useMyLocation')}</button>
          </div>
          <div className="col-auto">
            <div className="input-group">
              <span className="input-group-text">{t('buy.radiusKm')}</span>
              <input type="number" className="form-control" style={{ maxWidth: '90px' }} value={radius} onChange={e => setRadius(e.target.value)} />
            </div>
          </div>
          <div className="col-auto">
            <button onClick={search} className="btn text-white" style={{ background: '#2d6a4f' }}>{t('buyFields.findButton')}</button>
          </div>
          {message && <div className="col-auto text-success">{message}</div>}
        </div>
      </div>

      {fields.length > 0 && (
        <div className="container-fluid py-2" style={{ background: '#eef6f0' }}>
          <div className="row g-2 align-items-center">
            <div className="col-auto fw-bold">{t('buy.filterLabel')}</div>
            <div className="col-auto"><input className="form-control" placeholder={t('buy.productPlaceholder')} value={fName} onChange={e => setFName(e.target.value)} /></div>
            <div className="col-auto">
              <select className="form-select" value={fType} onChange={e => setFType(e.target.value)}>
                <option value="">{t('buy.anyType')}</option>
                <option value="fruit">{t('buy.categoryFruit')}</option>
                <option value="vegetable">{t('buy.categoryVegetable')}</option>
                <option value="herb">{t('buy.categoryHerb')}</option>
                <option value="other">{t('buy.categoryOther')}</option>
              </select>
            </div>
            <div className="col-auto">
              <div className="input-group">
                <span className="input-group-text">{t('buy.maxPricePerKg')}</span>
                <input type="number" className="form-control" style={{ maxWidth: '90px' }} value={fMaxPrice} onChange={e => setFMaxPrice(e.target.value)} />
              </div>
            </div>
            <div className="col-auto text-muted">{t('buy.matchCount', { count: visibleFields.length })}</div>
          </div>
        </div>
      )}

      <MapContainer center={[45.1, 16.5]} zoom={7} style={{ height: '30vh', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
        <LocationPicker onPick={setPin} />
        {pin && <Marker position={pin} />}
        {visibleFields.map(f => (
          f.latitude && f.longitude ? <Marker key={f.id} position={[f.latitude, f.longitude]} /> : null
        ))}
      </MapContainer>

      <div className="container py-3">
        <h3 style={{ marginTop: 0 }}>{t('buyFields.resultsHeading', { count: visibleFields.length })}</h3>
        <div className="row g-3">
          {visibleFields.map(f => (
            <div className="col-md-6" key={f.id}>
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 className="mb-0">{f.name}</h5>
                      <span className="text-muted small">{f.opg_name}</span>
                      {f.opg_rating > 0 && (
                        <span className="ms-2 small" style={{ color: '#e6a817' }}>
                          {'★'.repeat(Math.round(f.opg_rating))} <span className="text-muted">({f.opg_rating.toFixed(1)} · {f.opg_rating_count} ratings)</span>
                        </span>
                      )}
                      <div className="text-muted small">📍 {f.latitude?.toFixed(4)}, {f.longitude?.toFixed(4)}</div>
                      {f.owner_phone && <div className="small mt-1">📞 {f.owner_phone}</div>}
                    </div>
                    {f.owner_phone && (
                      <a href={`tel:${f.owner_phone}`} className="btn btn-sm text-white" style={{ background: '#2d6a4f' }}>{t('buy.call')}</a>
                    )}
                  </div>
                  <ul className="list-unstyled mt-2 mb-0">
                    {f.filtered.map(p => (
                      <li key={p.id} className="small py-1 border-top">
                        🍎 {p.catalog_name}{p.variety_name ? ` (${p.variety_name})` : ''} — <strong>€{p.price_per_kg}/kg</strong>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3">
                    {interested[f.id] ? (
                      <span className="text-success small">✅ Interest sent — the farmer can see you're interested.</span>
                    ) : (
                      <button onClick={() => expressInterest(f.id)} className="btn btn-sm btn-outline-success">
                        I'm interested 👋
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default BuyFields;
