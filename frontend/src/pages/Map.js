import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import Navbar from '../components/Navbar';
import 'leaflet/dist/leaflet.css';

function Map() {
  return (
    <>
      <Navbar />
      <div style={{ height: '90vh', width: '100%' }}>
        <MapContainer
          center={[45.1, 16.5]}
          zoom={7}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© OpenStreetMap contributors'
          />
        </MapContainer>
      </div>
    </>
  );
}

export default Map;