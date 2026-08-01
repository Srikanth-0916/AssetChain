import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';

// ─── Lazy-loaded page components ───────────────────────────────────────────────
const Landing           = lazy(() => import('../pages/Landing').then(m => ({ default: m.Landing })));
const Login             = lazy(() => import('../pages/Login').then(m => ({ default: m.Login })));
const Register          = lazy(() => import('../pages/Register').then(m => ({ default: m.Register })));
const ForgotPassword    = lazy(() => import('../pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const Dashboard         = lazy(() => import('../pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Profile           = lazy(() => import('../pages/Profile').then(m => ({ default: m.Profile })));
const Marketplace       = lazy(() => import('../pages/Marketplace').then(m => ({ default: m.Marketplace })));
const Portfolio         = lazy(() => import('../pages/Portfolio').then(m => ({ default: m.Portfolio })));
const AdminPanel        = lazy(() => import('../pages/AdminPanel').then(m => ({ default: m.AdminPanel })));
const CreateAsset       = lazy(() => import('../pages/CreateAsset').then(m => ({ default: m.CreateAsset })));
const AICopilot         = lazy(() => import('../pages/AICopilot').then(m => ({ default: m.AICopilot })));
const Analytics         = lazy(() => import('../pages/Analytics').then(m => ({ default: m.Analytics })));
const NotFound          = lazy(() => import('../pages/NotFound').then(m => ({ default: m.NotFound })));
const PrivacyCenter     = lazy(() => import('../pages/PrivacyCenter').then(m => ({ default: m.PrivacyCenter })));
const SecurityCenter    = lazy(() => import('../pages/SecurityCenter').then(m => ({ default: m.SecurityCenter })));

// ─── Dedicated RBAC Role Workspaces ────────────────────────────────────────────
const InvestorDashboard   = lazy(() => import('../pages/InvestorDashboard').then(m => ({ default: m.InvestorDashboard })));
const OwnerDashboard      = lazy(() => import('../pages/OwnerDashboard').then(m => ({ default: m.OwnerDashboard })));
const VerifierDashboard   = lazy(() => import('../pages/VerifierDashboard').then(m => ({ default: m.VerifierDashboard })));
const LegalDashboard      = lazy(() => import('../pages/LegalDashboard').then(m => ({ default: m.LegalDashboard })));
const ComplianceDashboard = lazy(() => import('../pages/ComplianceDashboard').then(m => ({ default: m.ComplianceDashboard })));
const AuditorDashboard    = lazy(() => import('../pages/AuditorDashboard').then(m => ({ default: m.AuditorDashboard })));

// ─── Investor Experience Pages ─────────────────────────────────────────
const RewardsCenter     = lazy(() => import('../pages/RewardsCenter').then(m => ({ default: m.RewardsCenter })));
const AchievementCenter = lazy(() => import('../pages/AchievementCenter').then(m => ({ default: m.AchievementCenter })));
const ActivityTimeline  = lazy(() => import('../pages/ActivityTimeline').then(m => ({ default: m.ActivityTimeline })));
const TransactionHistory= lazy(() => import('../pages/TransactionHistory').then(m => ({ default: m.TransactionHistory })));
const InvestmentJourney = lazy(() => import('../pages/InvestmentJourney').then(m => ({ default: m.InvestmentJourney })));
const RWACollateralVault = lazy(() => import('../pages/RWACollateralVault').then(m => ({ default: m.RWACollateralVault })));
const CopyTradingLeaderboard = lazy(() => import('../pages/CopyTradingLeaderboard').then(m => ({ default: m.CopyTradingLeaderboard })));
const OracleIoTValuation = lazy(() => import('../pages/OracleIoTValuation').then(m => ({ default: m.OracleIoTValuation })));

// ─── Loading fallback ──────────────────────────────────────────────────────────
function RouteLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
      <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-sm text-slate-400 font-medium">Loading RBAC Workspace Module...</p>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<RouteLoader />}>
        <MainLayout />
      </Suspense>
    ),
    errorElement: (
      <Suspense fallback={<RouteLoader />}>
        <NotFound />
      </Suspense>
    ),
    children: [
      { index: true, element: <Landing /> },
      { path: 'login',            element: <Login /> },
      { path: 'register',         element: <Register /> },
      { path: 'forgot-password',  element: <ForgotPassword /> },
      { path: 'marketplace',      element: <Marketplace /> },
      { path: 'security',         element: <SecurityCenter /> },

      // ─── Shared Base Protected Routes ─────────────────────────────────────────
      {
        path: 'dashboard',
        element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
      },
      {
        path: 'profile',
        element: <ProtectedRoute><Profile /></ProtectedRoute>,
      },
      {
        path: 'ai-copilot',
        element: <ProtectedRoute><AICopilot /></ProtectedRoute>,
      },
      {
        path: 'privacy',
        element: <ProtectedRoute><PrivacyCenter /></ProtectedRoute>,
      },

      // ─── Dedicated RBAC Role Workspaces ─────────────────────────────────────
      {
        path: 'investor',
        element: <ProtectedRoute requiredRoles={['investor', 'admin']}><InvestorDashboard /></ProtectedRoute>,
      },
      {
        path: 'owner',
        element: <ProtectedRoute requiredRoles={['asset_owner', 'admin']}><OwnerDashboard /></ProtectedRoute>,
      },
      {
        path: 'verifier',
        element: <ProtectedRoute requiredRoles={['verifier', 'admin']}><VerifierDashboard /></ProtectedRoute>,
      },
      {
        path: 'legal',
        element: <ProtectedRoute requiredRoles={['legal_reviewer', 'admin']}><LegalDashboard /></ProtectedRoute>,
      },
      {
        path: 'compliance',
        element: <ProtectedRoute requiredRoles={['compliance_officer', 'compliance', 'admin']}><ComplianceDashboard /></ProtectedRoute>,
      },
      {
        path: 'auditor',
        element: <ProtectedRoute requiredRoles={['auditor', 'admin']}><AuditorDashboard /></ProtectedRoute>,
      },

      // ─── Investor Experience Pages ───────────────────────────────────────────
      {
        path: 'rewards',
        element: <ProtectedRoute><RewardsCenter /></ProtectedRoute>,
      },
      {
        path: 'achievements',
        element: <ProtectedRoute><AchievementCenter /></ProtectedRoute>,
      },
      {
        path: 'activity',
        element: <ProtectedRoute><ActivityTimeline /></ProtectedRoute>,
      },
      {
        path: 'transactions',
        element: <ProtectedRoute><TransactionHistory /></ProtectedRoute>,
      },
      {
        path: 'journey',
        element: <ProtectedRoute><InvestmentJourney /></ProtectedRoute>,
      },
      {
        path: 'lending',
        element: <ProtectedRoute><RWACollateralVault /></ProtectedRoute>,
      },
      {
        path: 'copy-trading',
        element: <ProtectedRoute><CopyTradingLeaderboard /></ProtectedRoute>,
      },
      {
        path: 'oracles',
        element: <ProtectedRoute><OracleIoTValuation /></ProtectedRoute>,
      },

      // ─── Asset Owner Onboarding ──────────────────────────────────────────────
      {
        path: 'assets/create',
        element: <ProtectedRoute requiredRoles={['asset_owner', 'admin']}><CreateAsset /></ProtectedRoute>,
      },
      {
        path: 'my-assets',
        element: <ProtectedRoute requiredRoles={['asset_owner', 'admin']}><OwnerDashboard /></ProtectedRoute>,
      },

      // ─── Investor & Asset Owner Portfolio ────────────────────────────────────
      {
        path: 'portfolio',
        element: <ProtectedRoute requiredRoles={['investor', 'asset_owner', 'admin']}><Portfolio /></ProtectedRoute>,
      },

      // ─── Admin Workspace ─────────────────────────────────────────────────────
      {
        path: 'admin',
        element: <ProtectedRoute requiredRoles={['admin']}><AdminPanel /></ProtectedRoute>,
      },
      {
        path: 'analytics',
        element: <ProtectedRoute requiredRoles={['admin']}><Analytics /></ProtectedRoute>,
      },

      { path: '*', element: <NotFound /> },
    ],
  },
]);
