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
        🌾 Brazda
      </a>
      <div>
        <a href="/dashboard" style={{ color: 'white', marginRight: '20px', textDecoration: 'none' }}>Products</a>
        <a href="/map" style={{ color: 'white', marginRight: '20px', textDecoration: 'none' }}>My Parcels</a>
        <button onClick={logout} style={{ background: 'transparent', border: '1px solid white', color: 'white', padding: '5px 10px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;