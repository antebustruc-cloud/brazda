import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import Navbar from '../components/Navbar';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { API } from '../config';
import ProductManager from '../components/ProductManager';
import GetPaid from '../components/GetPaid';

function LocationPicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng);
    }
  });
  return null;
}

function Map() {
  const { t } = useTranslation();
  const [parcelName, setParcelName] = useState('');
  const [pin, setPin] = useState(null);
  const [message, setMessage] = useState('');
  const [parcels, setParcels] = useState([]);
  const [expandedParcel, setExpandedParcel] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const token = localStorage.getItem('access_token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchParcels = async () => {
    try {
      const res = await axios.get(`${API}/parcels/`, authHeader);
      setParcels(res.data);
    } catch (err) {
      console.log('Could not load parcels', err.response?.data);
    }
  };

  useEffect(() => {
    fetchParcels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!parcelName || !pin) {
      setMessage(t('myFields.validationError'));
      return;
    }
    try {
      await axios.post(`${API}/parcels/`, {
        name: parcelName,
        lat: pin.lat,
        lng: pin.lng
      }, authHeader);
      setMessage(t('myFields.saveSuccess'));
      setParcelName('');
      setPin(null);
      fetchParcels();
    } catch (err) {
      setMessage(t('myFields.saveError'));
      console.log(err.response?.data);
    }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditName(p.name);
  };

  const saveEdit = async (p) => {
    try {
      await axios.patch(`${API}/parcels/${p.id}/`, { name: editName }, authHeader);
      setEditingId(null);
      fetchParcels();
    } catch (err) {
      console.log('Edit error', err.response?.data);
    }
  };

  const deleteParcel = async (p) => {
    if (!window.confirm(t('myFields.deleteConfirm', { name: p.name }))) return;
    try {
      await axios.delete(`${API}/parcels/${p.id}/`, authHeader);
      fetchParcels();
    } catch (err) {
      console.log('Delete error', err.response?.data);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container-fluid py-3" style={{ background: '#f5f5f5' }}>
        <div className="row g-2 align-items-center">
          <div className="col-auto" style={{ minWidth: '300px' }}>
            <input
              className="form-control"
              placeholder={t('myFields.namePlaceholder')}
              value={parcelName}
              onChange={e => setParcelName(e.target.value)}
            />
          </div>
          <div className="col-auto">
            <button onClick={handleSave} className="btn text-white" style={{ background: '#2d6a4f' }}>
              {t('myFields.saveButton')}
            </button>
          </div>
          {message && <div className="col-auto text-success">{message}</div>}
          {pin && <div className="col-auto text-muted small">📍 {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}</div>}
        </div>
      </div>
      <div className="container-fluid py-2 small" style={{ background: '#eef6f0' }}>
        {t('myFields.mapHint')}
      </div>
      <MapContainer center={[45.1, 16.5]} zoom={7} style={{ height: '35vh', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© OpenStreetMap contributors'
        />
        <LocationPicker onPick={setPin} />
        {pin && <Marker position={pin} />}
      </MapContainer>
      <div className="container py-3">
        <h3 className="mb-3">{t('myFields.heading', { count: parcels.length })}</h3>
        {parcels.length === 0 && <p className="text-muted">{t('myFields.empty')}</p>}
        <div className="row g-3">
          {parcels.map(p => (
            <div className="col-12" key={p.id}>
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                      {editingId === p.id ? (
                        <input className="form-control d-inline-block" style={{ width: '200px' }}
                          value={editName} onChange={e => setEditName(e.target.value)} />
                      ) : (
                        <strong>{p.name}</strong>
                      )}
                      <span className="text-muted small ms-2">
                        📍 {p.latitude?.toFixed(4)}, {p.longitude?.toFixed(4)}
                      </span>
                    </div>
                    <div className="d-flex gap-2">
                      {editingId === p.id ? (
                        <>
                          <button onClick={() => saveEdit(p)} className="btn btn-sm text-white" style={{ background: '#2d6a4f' }}>
                            {t('common.save')}
                          </button>
                          <button onClick={() => setEditingId(null)} className="btn btn-sm btn-secondary">
                            {t('common.cancel')}
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setExpandedParcel(expandedParcel === p.id ? null : p.id)}
                            className="btn btn-sm text-white" style={{ background: '#2d6a4f' }}>
                            {expandedParcel === p.id ? t('common.close') : t('common.products')}
                          </button>
                          <button onClick={() => startEdit(p)} className="btn btn-sm text-white" style={{ background: '#5a8f73' }}>
                            {t('common.edit')}
                          </button>
                          <button onClick={() => deleteParcel(p)} className="btn btn-sm btn-outline-danger">
                            {t('common.delete')}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {expandedParcel === p.id && (
                    <>
                      <ProductManager channelType="parcel" channelId={p.id} />
                      <GetPaid channelType="parcel" channelId={p.id} />
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

export default Map;
