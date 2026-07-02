import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import Map from './pages/Map';
import OPGSettings from './pages/OPGSettings';
import Notifications from './pages/Notifications';
import AlertZones from './pages/AlertZones';
import IncomingSupplyRequests from './pages/IncomingSupplyRequests';
import RequireSeller from './components/RequireSeller';
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
          <Route path="/map" element={<RequireSeller><Map /></RequireSeller>} />
          <Route path="/opg" element={<RequireSeller><OPGSettings /></RequireSeller>} />
          <Route path="/stands" element={<RequireSeller><Stands /></RequireSeller>} />
          <Route path="/delivery" element={<RequireSeller><Delivery /></RequireSeller>} />
          <Route path="/buy-stands" element={<BuyStands />} />
          <Route path="/buy-fields" element={<BuyFields />} />
          <Route path="/buy-delivery" element={<BuyDelivery />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/alert-zones" element={<AlertZones />} />
          <Route path="/supply-requests" element={<RequireSeller><IncomingSupplyRequests /></RequireSeller>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;