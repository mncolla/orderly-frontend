import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'wouter';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    // No hacer nada mientras el usuario se está cargando
    if (isAuthLoading) {
      return;
    }

    // Redirigir al onboarding si es OWNER y no ha completado el onboarding
    // Permitir acceso a /onboarding y /integrations (para conectar primero)
    const isOnboardingPage = location === '/onboarding';
    const isIntegrationsPage = location === '/integrations';
    const needsOnboarding = user?.role === 'OWNER' && !user?.organization?.onboardingCompleted;

    if (needsOnboarding && !isOnboardingPage && !isIntegrationsPage) {
      navigate('/onboarding', { transition: true });
    }
  }, [user, location, navigate, isAuthLoading]);

  // Mostrar nada mientras carga el usuario
  if (isAuthLoading) {
    return null;
  }

  return <>{children}</>;
}
