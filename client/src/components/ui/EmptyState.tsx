import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: 'default' | 'card' | 'compact';
}

/**
 * EmptyState — consistent empty / zero-results / error placeholder.
 */
export function EmptyState({ icon, title, description, action, variant = 'default' }: EmptyStateProps) {
  if (variant === 'compact') {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 animate-fade-in">
        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
          {icon}
        </div>
        <p className="text-xs font-semibold text-slate-300">{title}</p>
        {description && <p className="text-[11px] text-slate-500 max-w-xs">{description}</p>}
        {action && <div className="mt-1">{action}</div>}
      </div>
    );
  }

  return (
    <div className="empty-state-v2 animate-fade-in">
      <div className="empty-state-v2-icon">
        {icon}
      </div>
      <p className="text-base font-bold text-white tracking-tight">{title}</p>
      {description && (
        <p className="text-xs text-slate-400 max-w-md leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-3 flex items-center gap-2">{action}</div>}
    </div>
  );
}

