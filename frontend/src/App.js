import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import Map from './pages/Map';
import Stands from './pages/Stands';
import Delivery from './pages/Delivery';
import BuyStands from './pages/BuyStands';
import BuyFields from './pages/BuyFields';
import BuyDelivery from './pages/BuyDelivery';


function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/map" element={<Map />} />
          <Route path="/stands" element={<Stands />} />
          <Route path="/delivery" element={<Delivery />} />
          <Route path="/buy-stands" element={<BuyStands />} />
          <Route path="/buy-fields" element={<BuyFields />} />
          <Route path="/buy-delivery" element={<BuyDelivery />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;