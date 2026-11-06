import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute({ adminOnly = false }) {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="route-loading">Checking your account…</div>;
  if (!user) return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate replace to="/" />;
  return <Outlet />;
}
