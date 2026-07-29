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

// ─── New pages ─────────────────────────────────────────────────────────────────
const RewardsCenter     = lazy(() => import('../pages/RewardsCenter').then(m => ({ default: m.RewardsCenter })));
const AchievementCenter = lazy(() => import('../pages/AchievementCenter').then(m => ({ default: m.AchievementCenter })));
const ActivityTimeline  = lazy(() => import('../pages/ActivityTimeline').then(m => ({ default: m.ActivityTimeline })));
const TransactionHistory= lazy(() => import('../pages/TransactionHistory').then(m => ({ default: m.TransactionHistory })));
const InvestmentJourney = lazy(() => import('../pages/InvestmentJourney').then(m => ({ default: m.InvestmentJourney })));

// ─── Loading fallback ──────────────────────────────────────────────────────────
function RouteLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
      <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-sm text-slate-400 font-medium">Loading module...</p>
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

      // ─── Protected: All authenticated users ───────────────────────────────
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

      // ─── NEW: Investor Experience Pages ───────────────────────────────────
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

      // ─── Protected: Asset Owner ────────────────────────────────────────────
      {
        path: 'assets/create',
        element: <ProtectedRoute requiredRoles={['asset_owner']}><CreateAsset /></ProtectedRoute>,
      },
      {
        path: 'my-assets',
        element: <ProtectedRoute requiredRoles={['asset_owner']}><Dashboard /></ProtectedRoute>,
      },

      // ─── Protected: Investor & Asset Owner ────────────────────────────────
      {
        path: 'portfolio',
        element: <ProtectedRoute requiredRoles={['investor', 'asset_owner']}><Portfolio /></ProtectedRoute>,
      },

      // ─── Protected: Admin only ─────────────────────────────────────────────
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
