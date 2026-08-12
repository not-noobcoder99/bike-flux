import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RoleProtectedRoute from './components/RoleProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import MapHome from './pages/MapHome.jsx';
import ScanUnlock from './pages/ScanUnlock.jsx';
import ActiveRide from './pages/ActiveRide.jsx';
import RideHistory from './pages/RideHistory.jsx';
import Wallet from './pages/Wallet.jsx';
import Profile from './pages/Profile.jsx';
import SimulateRide from './pages/SimulateRide.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminBikes from './pages/admin/AdminBikes.jsx';
import AdminZones from './pages/admin/AdminZones.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminPendingUsers from './pages/admin/AdminPendingUsers.jsx';
import AdminTransactions from './pages/admin/AdminTransactions.jsx';
import AdminSubscriptions from './pages/admin/AdminSubscriptions.jsx';
import AdminPricingPlans from './pages/admin/AdminPricingPlans.jsx';
import AdminVirtualCards from './pages/admin/AdminVirtualCards.jsx';
import AdminIotMonitor from './pages/admin/AdminIotMonitor.jsx';
import AdminRides from './pages/admin/AdminRides.jsx';
import MaintenanceDashboard from './pages/MaintenanceDashboard.jsx';

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
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/simulate" element={<ProtectedRoute><SimulateRide /></ProtectedRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<RoleProtectedRoute roles={['admin']}><AdminDashboard /></RoleProtectedRoute>} />
        <Route path="/admin/rides" element={<RoleProtectedRoute roles={['admin']}><AdminRides /></RoleProtectedRoute>} />
        <Route path="/admin/bikes" element={<RoleProtectedRoute roles={['admin']}><AdminBikes /></RoleProtectedRoute>} />
        <Route path="/admin/zones" element={<RoleProtectedRoute roles={['admin']}><AdminZones /></RoleProtectedRoute>} />
        <Route path="/admin/users" element={<RoleProtectedRoute roles={['admin']}><AdminUsers /></RoleProtectedRoute>} />
        <Route path="/admin/pending-users" element={<RoleProtectedRoute roles={['admin']}><AdminPendingUsers /></RoleProtectedRoute>} />
        <Route path="/admin/transactions" element={<RoleProtectedRoute roles={['admin']}><AdminTransactions /></RoleProtectedRoute>} />
        <Route path="/admin/subscriptions" element={<RoleProtectedRoute roles={['admin']}><AdminSubscriptions /></RoleProtectedRoute>} />
        <Route path="/admin/pricing" element={<RoleProtectedRoute roles={['admin']}><AdminPricingPlans /></RoleProtectedRoute>} />
        <Route path="/admin/virtual-cards" element={<RoleProtectedRoute roles={['admin']}><AdminVirtualCards /></RoleProtectedRoute>} />
        <Route path="/admin/iot" element={<RoleProtectedRoute roles={['admin']}><AdminIotMonitor /></RoleProtectedRoute>} />
        
        <Route path="/maintenance" element={<RoleProtectedRoute roles={['maintenance']}><MaintenanceDashboard /></RoleProtectedRoute>} />
      </Routes>
    </div>
  );
}
