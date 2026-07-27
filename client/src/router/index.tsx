import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { Landing } from '../pages/Landing';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { ForgotPassword } from '../pages/ForgotPassword';
import { Dashboard } from '../pages/Dashboard';
import { Profile } from '../pages/Profile';
import { Marketplace } from '../pages/Marketplace';
import { Portfolio } from '../pages/Portfolio';
import { AdminPanel } from '../pages/AdminPanel';
import { CreateAsset } from '../pages/CreateAsset';
import { AICopilot } from '../pages/AICopilot';
import { Analytics } from '../pages/Analytics';
import { NotFound } from '../pages/NotFound';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'marketplace', element: <Marketplace /> },

      // ─── Protected: All authenticated users ───
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: 'ai-copilot',
        element: (
          <ProtectedRoute>
            <AICopilot />
          </ProtectedRoute>
        ),
      },

      // ─── Protected: Asset Owner ───
      {
        path: 'assets/create',
        element: (
          <ProtectedRoute requiredRoles={['asset_owner']}>
            <CreateAsset />
          </ProtectedRoute>
        ),
      },
      {
        path: 'my-assets',
        element: (
          <ProtectedRoute requiredRoles={['asset_owner']}>
            <Dashboard />
          </ProtectedRoute>
        ),
      },

      // ─── Protected: Investor & Asset Owner ───
      {
        path: 'portfolio',
        element: (
          <ProtectedRoute requiredRoles={['investor', 'asset_owner']}>
            <Portfolio />
          </ProtectedRoute>
        ),
      },

      // ─── Protected: Admin only ───
      {
        path: 'admin',
        element: (
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminPanel />
          </ProtectedRoute>
        ),
      },
      {
        path: 'analytics',
        element: (
          <ProtectedRoute requiredRoles={['admin']}>
            <Analytics />
          </ProtectedRoute>
        ),
      },

      { path: '*', element: <NotFound /> },
    ],
  },
]);
