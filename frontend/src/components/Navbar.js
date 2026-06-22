import React from 'react';

function Navbar() {
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark" style={{ background: '#2d6a4f' }}>
      <div className="container-fluid">
        <a className="navbar-brand fw-bold" href="/dashboard">🌾 Ubrano</a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="nav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item"><span className="nav-link text-white-50 small">SELL</span></li>
            <li className="nav-item"><a className="nav-link" href="/map">My Fields</a></li>
            <li className="nav-item"><a className="nav-link" href="/stands">My Stands</a></li>
            <li className="nav-item"><a className="nav-link" href="/delivery">My Delivery</a></li>
            <li className="nav-item"><span className="nav-link text-white-50 small">BUY</span></li>
            <li className="nav-item"><a className="nav-link" href="/buy-fields">Find Fields</a></li>
            <li className="nav-item"><a className="nav-link" href="/buy-stands">Find Stands</a></li>
            <li className="nav-item"><a className="nav-link" href="/buy-delivery">Find Delivery</a></li>
          </ul>
          <button onClick={logout} className="btn btn-outline-light btn-sm">Logout</button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
