import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/authContext.js';
import { Loader2 } from 'lucide-react';
import '../pages/Auth.css';

export default function PublicRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <Loader2 className="auth-spinner" size={36} />
        <p>Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
