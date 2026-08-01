/**
 * Helper to resolve role-specific dashboard path for authenticated users.
 */
export function getRoleDashboardPath(role?: string): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'asset_owner':
      return '/owner';
    case 'verifier':
      return '/verifier';
    case 'legal_reviewer':
      return '/legal';
    case 'compliance_officer':
    case 'compliance':
      return '/compliance';
    case 'auditor':
      return '/auditor';
    case 'investor':
    default:
      return '/investor';
  }
}

/**
 * Enterprise Control Center Name mapping for institutional UI.
 */
export function getRoleWorkspaceTitle(role?: string): string {
  switch (role) {
    case 'admin':
      return 'Admin Control Center';
    case 'asset_owner':
      return 'Asset Owner Control Center';
    case 'verifier':
      return 'Verifier Control Center';
    case 'legal_reviewer':
      return 'Legal Control Center';
    case 'compliance_officer':
    case 'compliance':
      return 'Compliance Control Center';
    case 'auditor':
      return 'Auditor Control Center';
    case 'investor':
    default:
      return 'Investor Control Center';
  }
}
