import React from 'react';

function Navbar() {
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/';
  };

  return (
    <nav style={{
      background: '#2d6a4f',
      padding: '10px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <a href="/dashboard" style={{ color: 'white', textDecoration: 'none', fontSize: '20px', fontWeight: 'bold' }}>
        🌾 Ubrano
      </a>
      <div>
        <a href="/dashboard" style={{ color: 'white', marginRight: '20px', textDecoration: 'none' }}>Browse</a>
        <a href="/map" style={{ color: 'white', marginRight: '20px', textDecoration: 'none' }}>My Parcels</a>
        <a href="/products" style={{ color: 'white', marginRight: '20px', textDecoration: 'none' }}>My Products</a>
        <a href="/stands" style={{ color: 'white', marginRight: '20px', textDecoration: 'none' }}>My Stands</a>
        <a href="/delivery" style={{ color: 'white', marginRight: '20px', textDecoration: 'none' }}>Delivery</a>
        <button onClick={logout} style={{ background: 'transparent', border: '1px solid white', color: 'white', padding: '5px 10px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;