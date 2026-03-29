import { Router, Route, Redirect } from 'wouter';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { OnboardingGuard } from './components/OnboardingGuard';
import { Sidebar } from './components/Sidebar';
import { OnboardingWizard } from './components/OnboardingWizard';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DebugPage from './pages/DebugPage';
import { OverviewPage } from './pages/OverviewPage';
import { OperationsPage } from './pages/OperationsPage';
import { MenuPage } from './pages/MenuPage';
import { SuggestionsPage } from './pages/SuggestionsPage';
import { HistoryPage } from './pages/HistoryPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { StoresPage } from './pages/StoresPage';
import { AgencyPage } from './pages/AgencyPage';
import { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';

function RoleBasedRedirect() {
  const { user } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (user) {
      setShouldRedirect(true);
    }
  }, [user]);

  if (!shouldRedirect) return null;

  return <Redirect to={user?.role === 'AGENCY' ? '/agency' : '/overview'} />;
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Debug route - SIN AUTENTICACIÓN - Solo desarrollo */}
        <Route path="/debug" component={DebugPage} />

        <Route path="/login" component={LoginPage} />
        <Route path="/signup" component={SignupPage} />
        <Route path="/onboarding">
          <ProtectedRoute>
            <OnboardingWizard />
          </ProtectedRoute>
        </Route>
        <Route path="/integrations">
          <ProtectedRoute>
            <DashboardLayout>
              <IntegrationsPage />
            </DashboardLayout>
          </ProtectedRoute>
        </Route>
        <Route path="/overview">
          <ProtectedRoute>
            <OnboardingGuard>
              <DashboardLayout>
                <OverviewPage />
              </DashboardLayout>
            </OnboardingGuard>
          </ProtectedRoute>
        </Route>
        <Route path="/operations">
          <ProtectedRoute>
            <OnboardingGuard>
              <DashboardLayout>
                <OperationsPage />
              </DashboardLayout>
            </OnboardingGuard>
          </ProtectedRoute>
        </Route>
        <Route path="/menu">
          <ProtectedRoute>
            <OnboardingGuard>
              <DashboardLayout>
                <MenuPage />
              </DashboardLayout>
            </OnboardingGuard>
          </ProtectedRoute>
        </Route>
        <Route path="/stores">
          <ProtectedRoute>
            <OnboardingGuard>
              <DashboardLayout>
                <StoresPage />
              </DashboardLayout>
            </OnboardingGuard>
          </ProtectedRoute>
        </Route>
        <Route path="/suggestions">
          <ProtectedRoute>
            <OnboardingGuard>
              <DashboardLayout>
                <SuggestionsPage />
              </DashboardLayout>
            </OnboardingGuard>
          </ProtectedRoute>
        </Route>
        <Route path="/history">
          <ProtectedRoute>
            <OnboardingGuard>
              <DashboardLayout>
                <HistoryPage />
              </DashboardLayout>
            </OnboardingGuard>
          </ProtectedRoute>
        </Route>
        <Route path="/settings">
          <ProtectedRoute>
            <OnboardingGuard>
              <DashboardLayout>
                <SettingsPage />
              </DashboardLayout>
            </OnboardingGuard>
          </ProtectedRoute>
        </Route>
        {/* Agency Routes - Simplificadas a una sola página */}
        <Route path="/agency">
          <ProtectedRoute>
            <DashboardLayout>
              <AgencyPage />
            </DashboardLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/">
          <ProtectedRoute>
            <RoleBasedRedirect />
          </ProtectedRoute>
        </Route>
      </Router>
    </AuthProvider>
  );
}

export default App;
