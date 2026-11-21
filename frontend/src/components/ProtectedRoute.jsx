import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext.js';
import { Loader2 } from 'lucide-react';
import '../pages/Auth.css';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <Loader2 className="auth-spinner" size={36} />
        <p>Verifying BugFlow session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
