import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="brand">Bike Flux</Link>
      {user && (
        <div className="nav-links">
          <Link to="/">Map</Link>
          <Link to="/history">History</Link>
          <Link to="/wallet">Wallet</Link>
          {user.role === 'admin' && <Link to="/admin">Admin</Link>}
          {user.role === 'maintenance' && <Link to="/maintenance">Maintenance</Link>}
          <button onClick={logout}>Logout</button>
        </div>
      )}
    </nav>
  );
}
