import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Bike, Map, History, Wallet, Shield, Wrench, LogOut, Menu, X, User, Play } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  function isActive(path) {
    return location.pathname === path;
  }

  function linkStyle(path) {
    return isActive(path) ? { color: 'var(--text-primary)', background: 'var(--bg-glass-hover)' } : {};
  }

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <Bike size={24} />
        <span>Bike<span className="brand-text-gradient">Flux</span></span>
      </Link>

      {user && (
        <>
          <button className="nav-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className={`nav-links${menuOpen ? ' open' : ''}`}>
            <Link to="/" style={linkStyle('/')}>
              <Map size={18} /> Map
            </Link>
            <Link to="/history" style={linkStyle('/history')}>
              <History size={18} /> History
            </Link>
            <Link to="/wallet" style={linkStyle('/wallet')}>
              <Wallet size={18} /> Wallet
            </Link>
            <Link to="/simulate" style={linkStyle('/simulate')}>
              <Play size={18} /> Simulate
            </Link>
            <Link to="/profile" style={linkStyle('/profile')}>
              <User size={18} /> Profile
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin" style={linkStyle('/admin')}>
                <Shield size={18} /> Admin
              </Link>
            )}
            {user.role === 'maintenance' && (
              <Link to="/maintenance" style={linkStyle('/maintenance')}>
                <Wrench size={18} /> Maintenance
              </Link>
            )}
            <button onClick={logout} className="nav-logout-btn">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </>
      )}
    </nav>
  );
}
