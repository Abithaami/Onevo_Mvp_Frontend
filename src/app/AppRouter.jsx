import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
/**
 * `/app/*` is wrapped only by `WorkspaceLayout` (authenticated shell). Route guards (session + onboarding)
 * live there — not here — so this file stays a flat route table with no extra wrappers.
 * `AuthProvider` supplies backend session state (`GET /api/auth/google/session`) for the whole tree.
 */
import { AuthProvider } from '../auth/AuthProvider.jsx';
import { WorkspaceStateProvider } from '../auth/WorkspaceStateProvider.jsx';
import WorkspaceLayout from '../layouts/WorkspaceLayout.jsx';
import AuthPage from '../pages/AuthPage.jsx';
import MarketingHomePage from '../pages/MarketingHomePage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import OnboardingPage from '../pages/OnboardingPage.jsx';
import ApprovalPage from '../pages/ApprovalPage.jsx';
import IntegrationsPage from '../pages/IntegrationsPage.jsx';
import AnalyticsPage from '../pages/AnalyticsPage.jsx';
import SettingsPage from '../pages/SettingsPage.jsx';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <WorkspaceStateProvider>
      <Routes>
        <Route path="/" element={<MarketingHomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/app" element={<WorkspaceLayout />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="dashboard/:section" element={<DashboardPage />} />
          <Route path="onboarding" element={<OnboardingPage />} />
          <Route path="approval" element={<ApprovalPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </WorkspaceStateProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
