import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import Map from './pages/Map';
import Products from './pages/Products';
import Stands from './pages/Stands';


function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/map" element={<Map />} />
          <Route path="/products" element={<Products />} />
          <Route path="/stands" element={<Stands />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;