import React from 'react';
import Navbar from '../components/Navbar';

function Dashboard() {
  return (
    <>
      <Navbar />
      <div className="container" style={{ maxWidth: '900px', marginTop: '40px' }}>
        <div className="text-center mb-5">
          <h2 style={{ color: '#2d6a4f', fontWeight: 'bold' }}>Welcome to Ubrano 🌾</h2>
          <p className="text-muted">Fresh produce, direct from local farmers.</p>
        </div>

        <div className="row g-4">
          <div className="col-md-6">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body text-center p-4">
                <h3 style={{ color: '#2d6a4f' }}>🧺 I want to buy</h3>
                <p className="text-muted">Find fresh produce near you — pick it yourself, grab it from a stand, or get it delivered.</p>
                <a href="/buy-fields" className="btn text-white m-1" style={{ background: '#2d6a4f' }}>Find Fields</a>
                <a href="/buy-stands" className="btn text-white m-1" style={{ background: '#2d6a4f' }}>Find Stands</a>
                <a href="/buy-delivery" className="btn text-white m-1" style={{ background: '#2d6a4f' }}>Find Delivery</a>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body text-center p-4">
                <h3 style={{ color: '#2d6a4f' }}>🚜 I want to sell</h3>
                <p className="text-muted">List your produce — open your fields for picking, set up a stand, or announce a delivery run.</p>
                <a href="/map" className="btn text-white m-1" style={{ background: '#2d6a4f' }}>My Fields</a>
                <a href="/stands" className="btn text-white m-1" style={{ background: '#2d6a4f' }}>My Stands</a>
                <a href="/delivery" className="btn text-white m-1" style={{ background: '#2d6a4f' }}>My Delivery</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
