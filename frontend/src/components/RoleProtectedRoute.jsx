import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

export default function RoleProtectedRoute({ children, roles }) {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      {roles.includes(user?.role) ? children : <Navigate to="/" replace />}
    </ProtectedRoute>
  );
}
