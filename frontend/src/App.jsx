import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import MapHome from './pages/MapHome.jsx';
import ScanUnlock from './pages/ScanUnlock.jsx';
import ActiveRide from './pages/ActiveRide.jsx';
import RideHistory from './pages/RideHistory.jsx';
import Wallet from './pages/Wallet.jsx';

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={<ProtectedRoute><MapHome /></ProtectedRoute>} />
        <Route path="/scan" element={<ProtectedRoute><ScanUnlock /></ProtectedRoute>} />
        <Route path="/ride" element={<ProtectedRoute><ActiveRide /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><RideHistory /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}
