/**
 * Role-Based Access Control (RBAC) & Workspace Routing Matrix
 */

export type UserRole =
  | 'investor'
  | 'asset_owner'
  | 'legal_reviewer'
  | 'compliance_officer'
  | 'admin'
  | 'auditor';

export const ROLE_WORKSPACE_PATHS: Record<string, string> = {
  investor: '/investor',
  asset_owner: '/owner',
  verifier: '/verifier',
  legal_reviewer: '/legal',
  compliance_officer: '/compliance',
  compliance: '/compliance',
  admin: '/admin',
  auditor: '/auditor',
};

export function getRoleDashboardPath(role?: string | null): string {
  if (!role) return '/investor';
  const normalized = role.toLowerCase().trim();
  return ROLE_WORKSPACE_PATHS[normalized] || '/investor';
}

export function isRoleAuthorized(userRole?: string | null, requiredRoles?: string[]): boolean {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  if (!userRole) return false;

  const normalizedUserRole = userRole.toLowerCase().trim();

  // Admin has universal superuser access
  if (normalizedUserRole === 'admin') return true;

  return requiredRoles.map((r) => r.toLowerCase().trim()).includes(normalizedUserRole);
}
