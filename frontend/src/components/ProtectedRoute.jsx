import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const RequireAuth = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export const RequireRole = ({ role }) => {
  const { role: currentRole } = useAuth();

  if (currentRole !== role) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
