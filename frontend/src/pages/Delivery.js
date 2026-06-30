import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import Navbar from '../components/Navbar';
import ProductManager from '../components/ProductManager';
import GetPaid from '../components/GetPaid';
import NotifyNearby from '../components/NotifyNearby';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { API, FEATURES } from '../config';

function LocationPicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng);
    }
  });
  return null;
}

function Delivery() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', radius_km: '10', route_corridor_km: '0', delivery_date: '' });
  const [pin, setPin] = useState(null);
  const [message, setMessage] = useState('');
  const [events, setEvents] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const token = localStorage.getItem('access_token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API}/delivery/`, authHeader);
      setEvents(res.data);
    } catch (err) {
      console.log('Could not load deliveries', err.response?.data);
    }
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!form.name || !form.delivery_date || !pin) {
      setMessage(t('myDelivery.validationError'));
      return;
    }
    try {
      await axios.post(`${API}/delivery/`, {
        name: form.name,
        radius_km: form.radius_km,
        route_corridor_km: form.route_corridor_km,
        delivery_date: form.delivery_date,
        lat: pin.lat,
        lng: pin.lng
      }, authHeader);
      setMessage(t('myDelivery.saveSuccess'));
      setForm({ name: '', radius_km: '10', route_corridor_km: '0', delivery_date: '' });
      setPin(null);
      fetchEvents();
    } catch (err) {
      setMessage(t('myDelivery.saveError'));
      console.log(err.response?.data);
    }
  };

  const startEdit = (ev) => {
    setEditingId(ev.id);
    setEditName(ev.name);
  };

  const saveEdit = async (ev) => {
    try {
      await axios.patch(`${API}/delivery/${ev.id}/`, { name: editName }, authHeader);
      setEditingId(null);
      fetchEvents();
    } catch (err) {
      console.log('Edit error', err.response?.data);
    }
  };

  const deleteEvent = async (ev) => {
    if (!window.confirm(t('myDelivery.deleteConfirm', { name: ev.name }))) return;
    try {
      await axios.delete(`${API}/delivery/${ev.id}/`, authHeader);
      fetchEvents();
    } catch (err) {
      console.log('Delete error', err.response?.data);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container-fluid py-3" style={{ background: '#f5f5f5' }}>
        <h5 className="mb-3" style={{ color: '#2d6a4f' }}>{t('myDelivery.title')}</h5>
        <div className="row g-2 align-items-center">
          <div className="col-auto" style={{ minWidth: '250px' }}>
            <input name="name" className="form-control" placeholder={t('myDelivery.namePlaceholder')}
              value={form.name} onChange={handleChange} />
          </div>
          <div className="col-auto">
            <div className="input-group">
              <span className="input-group-text">{t('myDelivery.dateLabel')}</span>
              <input name="delivery_date" type="date" className="form-control" value={form.delivery_date} onChange={handleChange} />
            </div>
          </div>
          <div className="col-auto">
            <div className="input-group">
              <span className="input-group-text">{t('buy.radiusKm')}</span>
              <input name="radius_km" type="number" className="form-control" style={{ maxWidth: '90px' }}
                value={form.radius_km} onChange={handleChange} />
            </div>
          </div>
          <div className="col-auto">
            <div className="input-group">
              <span className="input-group-text">{t('myDelivery.corridorLabel')}</span>
              <input name="route_corridor_km" type="number" min="0" className="form-control" style={{ maxWidth: '90px' }}
                value={form.route_corridor_km} onChange={handleChange} />
            </div>
          </div>
          <div className="col-auto">
            <button onClick={handleSave} className="btn text-white" style={{ background: '#2d6a4f' }}>
              {t('myDelivery.saveButton')}
            </button>
          </div>
          {message && <div className="col-auto text-success">{message}</div>}
        </div>
        <div className="small text-muted mt-2">{t('myDelivery.corridorHint')}</div>
      </div>
      <div className="container-fluid py-2 small" style={{ background: '#eef6f0' }}>
        {t('myDelivery.mapHint')}
      </div>
      <MapContainer center={[45.1, 16.5]} zoom={7} style={{ height: '35vh', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
        <LocationPicker onPick={setPin} />
        {pin && <Marker position={pin} />}
      </MapContainer>
      <div className="container py-3">
        <h3 className="mb-3">{t('myDelivery.heading', { count: events.length })}</h3>
        {events.length === 0 && <p className="text-muted">{t('myDelivery.empty')}</p>}
        <div className="row g-3">
          {events.map(ev => (
            <div className="col-12" key={ev.id}>
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                      {editingId === ev.id ? (
                        <input className="form-control d-inline-block" style={{ width: '200px' }}
                          value={editName} onChange={e => setEditName(e.target.value)} />
                      ) : (
                        <strong>{ev.name}</strong>
                      )}
                      <span className="text-muted small ms-2">
                        📅 {ev.delivery_date} · {ev.radius_km}{t('myDelivery.radiusSuffix')}
                      </span>
                      <span className={`badge ms-2 ${ev.is_active ? 'bg-success' : 'bg-secondary'}`}>
                        {ev.is_active ? t('common.active') : t('common.inactive')}
                      </span>
                    </div>
                    <div className="d-flex gap-2">
                      {editingId === ev.id ? (
                        <>
                          <button onClick={() => saveEdit(ev)} className="btn btn-sm text-white" style={{ background: '#2d6a4f' }}>
                            {t('common.save')}
                          </button>
                          <button onClick={() => setEditingId(null)} className="btn btn-sm btn-secondary">
                            {t('common.cancel')}
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setExpanded(expanded === ev.id ? null : ev.id)}
                            className="btn btn-sm text-white" style={{ background: '#2d6a4f' }}>
                            {expanded === ev.id ? t('common.close') : t('common.products')}
                          </button>
                          <button onClick={() => startEdit(ev)} className="btn btn-sm text-white" style={{ background: '#5a8f73' }}>
                            {t('common.edit')}
                          </button>
                          <button onClick={() => deleteEvent(ev)} className="btn btn-sm btn-outline-danger">
                            {t('common.delete')}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {expanded === ev.id && (
                    <>
                      <ProductManager channelType="delivery_event" channelId={ev.id} />
                      <GetPaid channelType="delivery_event" channelId={ev.id} />
                      {FEATURES.notifications && <NotifyNearby channelType="delivery_event" channelId={ev.id} />}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Delivery;
