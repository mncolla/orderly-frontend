import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'wouter';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute = ({ children, redirectTo = '/login' }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  // Redirigir si no está autenticado
  if (!isLoading && !isAuthenticated) {
    navigate(redirectTo, { transition: true });
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
