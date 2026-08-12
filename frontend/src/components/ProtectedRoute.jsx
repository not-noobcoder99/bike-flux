import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="spinner-page">
        <div className="spinner"></div>
        <span className="spinner-text">Loading your session...</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}
