import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * EmptyState — consistent empty / zero-results / error placeholder.
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state animate-fade-in">
      <div className="empty-state-icon">
        <span className="text-slate-500">{icon}</span>
      </div>
      <p className="text-sm font-semibold text-slate-300">{title}</p>
      {description && (
        <p className="text-xs text-slate-500 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
