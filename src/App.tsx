import { Router, Route, Redirect } from 'wouter';
import { AuthProvider } from './contexts/AuthContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { OnboardingGuard } from './components/OnboardingGuard';
import { Sidebar } from './components/Sidebar';
import { OnboardingWizard } from './components/OnboardingWizard';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { OverviewPage } from './pages/OverviewPage';
import { OperationsPage } from './pages/OperationsPage';
import { MenuPage } from './pages/MenuPage';
import { SuggestionsPage } from './pages/SuggestionsPage';
import { HistoryPage } from './pages/HistoryPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AgencyDashboard } from './pages/AgencyDashboard';
import { AgencyOrganizationsPage } from './pages/AgencyOrganizationsPage';
import { AgencyOrganizationDetailPage } from './pages/AgencyOrganizationDetailPage';
import { CreateSuggestionPage } from './pages/CreateSuggestionPage';
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
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <Router>
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
          {/* Agency Routes */}
          <Route path="/agency">
            <ProtectedRoute>
              <DashboardLayout>
                <AgencyDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          <Route path="/agency/organizations">
            <ProtectedRoute>
              <DashboardLayout>
                <AgencyOrganizationsPage />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          <Route path="/agency/organizations/:id">
            <ProtectedRoute>
              <DashboardLayout>
                <AgencyOrganizationDetailPage />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          <Route path="/agency/suggestions">
            <ProtectedRoute>
              <DashboardLayout>
                <SuggestionsPage />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          <Route path="/agency/suggestions/create">
            <ProtectedRoute>
              <DashboardLayout>
                <CreateSuggestionPage />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/">
            <ProtectedRoute>
              <RoleBasedRedirect />
            </ProtectedRoute>
          </Route>
        </Router>
      </OrganizationProvider>
    </AuthProvider>
  );
}

export default App;
