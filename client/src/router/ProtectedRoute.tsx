import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isRoleAuthorized, getRoleDashboardPath } from '../utils/rbac';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

/**
 * Protected route wrapper that enforces authentication and RBAC permissions.
 * Unauthorized role access redirects automatically to the user's assigned workspace.
 */
export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Verifying RBAC Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user && !isRoleAuthorized(user.role, requiredRoles)) {
    const targetDashboard = getRoleDashboardPath(user.role);
    return <Navigate to={targetDashboard} replace />;
  }

  return <>{children}</>;
}
