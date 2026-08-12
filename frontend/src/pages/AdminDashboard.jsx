import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client.js';
import {
  LayoutDashboard, Bike, MapPin, Users, UserCheck, Tag, CreditCard, Receipt,
  Cpu, AlertCircle, Zap, DollarSign, Crown, Route
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  function refreshStats() { client.get('/admin/dashboard').then((res) => setStats(res.data)); }
  useEffect(refreshStats, []);

  const statCards = stats ? [
    { icon: Bike, label: 'Available', value: stats.scooty_counts.available || 0, color: '#22c55e' },
    { icon: Zap, label: 'In Use', value: stats.scooty_counts.in_use || 0, color: '#3b82f6' },
    { icon: Bike, label: 'Maintenance', value: stats.scooty_counts.maintenance || 0, color: '#f59e0b' },
    { icon: AlertCircle, label: 'Open Logs', value: stats.open_maintenance_logs, color: '#ef4444' },
    { icon: MapPin, label: 'Zones', value: stats.zone_count, color: '#8b5cf6' },
    { icon: Users, label: 'Pending Users', value: stats.pending_users, color: '#ec4899' },
    { icon: Receipt, label: 'Transactions', value: stats.total_transactions, color: '#06b6d4' },
    { icon: DollarSign, label: 'Revenue', value: `PKR ${stats.total_revenue}`, color: '#22c55e' },
    { icon: Crown, label: 'Active Subs', value: stats.active_subscriptions, color: '#f59e0b' },
  ] : [];

  const adminLinks = [
    { to: '/admin/rides', label: 'All Rides', icon: Route, color: '#f97316', desc: 'System-wide ride history' },
    { to: '/admin/bikes', label: 'Manage Bikes', icon: Bike, color: '#22c55e', desc: 'Add, edit, or recharge fleet' },
    { to: '/admin/zones', label: 'Parking Zones', icon: MapPin, color: '#8b5cf6', desc: 'Manage geofenced areas' },
    { to: '/admin/users', label: 'All Users', icon: Users, color: '#3b82f6', desc: 'Manage riders and roles' },
    { to: '/admin/pending-users', label: 'Pending Users', icon: UserCheck, color: '#ec4899', desc: 'Approve new registrations' },
    { to: '/admin/transactions', label: 'Transactions', icon: Receipt, color: '#06b6d4', desc: 'View billing & topups' },
    { to: '/admin/subscriptions', label: 'Subscriptions', icon: Crown, color: '#f59e0b', desc: 'Active user plans' },
    { to: '/admin/pricing', label: 'Pricing Plans', icon: Tag, color: '#f43f5e', desc: 'Configure rates' },
    { to: '/admin/virtual-cards', label: 'Virtual Cards', icon: CreditCard, color: '#facc15', desc: 'User wallets and balances' },
    { to: '/admin/iot', label: 'IoT Monitor', icon: Cpu, color: '#ec4899', desc: 'Hardware status and pings' },
  ];

  return (
    <div className="dashboard-page dashboard-mesh-bg fade-in">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '2.5rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'var(--accent-gradient)', boxShadow: 'var(--accent-glow)', marginBottom: '1rem' }}>
          <LayoutDashboard size={28} color="white" />
        </div>
        <h2 style={{ fontSize: '2.2rem', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>Admin Control Center</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '500px', fontSize: '1rem' }}>
          Real-time overview of your fleet, revenue, and active operations.
        </p>
      </div>

      {stats && (
        <div className="stats-row" style={{ marginBottom: '3.5rem' }}>
          {statCards.map((sc, i) => (
            <div className="stat-card" key={i} style={{ borderRadius: 'var(--radius-xl)', padding: '1.5rem' }}>
              <div className="stat-icon" style={{ background: `linear-gradient(135deg, ${sc.color}, ${sc.color}99)`, width: '48px', height: '48px' }}>
                <sc.icon size={24} />
              </div>
              <span className="stat-value" style={{ fontSize: '2rem', marginTop: '0.5rem' }}>{sc.value}</span>
              <span className="stat-label">{sc.label}</span>
            </div>
          ))}
        </div>
      )}

      <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Management Modules</h3>
      <div className="admin-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '1.5rem', 
      }}>
        {adminLinks.map((link) => (
          <Link to={link.to} key={link.to} className="premium-card" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div className="card-icon-wrap" style={{ color: link.color, borderColor: `${link.color}40`, background: `${link.color}15` }}>
                <link.icon size={22} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>{link.label}</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{link.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
