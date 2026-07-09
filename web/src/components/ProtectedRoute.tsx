import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, role }: { children: ReactNode; role?: UserRole }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <div className="p-10 text-center text-neutral-500">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
