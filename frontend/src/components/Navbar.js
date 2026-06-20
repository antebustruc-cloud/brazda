import React from 'react';

function Navbar() {
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/';
  };

  const linkStyle = { color: 'white', marginRight: '15px', textDecoration: 'none' };

  return (
    <nav style={{
      background: '#2d6a4f',
      padding: '10px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap'
    }}>
      <a href="/dashboard" style={{ color: 'white', textDecoration: 'none', fontSize: '20px', fontWeight: 'bold', marginRight: '20px' }}>
        🌾 Ubrano
      </a>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ color: '#a8d5ba', marginRight: '10px', fontSize: '13px' }}>SELL:</span>
        <a href="/map" style={linkStyle}>My Fields</a>
        <a href="/stands" style={linkStyle}>My Stands</a>
        <a href="/delivery" style={linkStyle}>My Delivery</a>
        <span style={{ color: '#a8d5ba', margin: '0 10px', fontSize: '13px' }}>BUY:</span>
        <a href="/buy-stands" style={linkStyle}>Find Stands</a>
        <a href="/buy-fields" style={linkStyle}>Find Fields</a>
        <a href="/buy-delivery" style={linkStyle}>Find Delivery</a>        <button onClick={logout} style={{ background: 'transparent', border: '1px solid white', color: 'white', padding: '5px 10px', cursor: 'pointer', marginLeft: '10px' }}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;