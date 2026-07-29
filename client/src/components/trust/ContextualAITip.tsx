import React from 'react';
import { Lightbulb, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ContextualAITipProps {
  type?: 'general' | 'concentration' | 'recommendation' | 'payment';
  title?: string;
  message: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function ContextualAITip({
  type = 'general',
  title = 'AI Insight',
  message,
  actionText,
  actionHref,
  onAction,
}: ContextualAITipProps) {
  const isConcentration = type === 'concentration';

  return (
    <div
      className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs transition-all ${
        isConcentration
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
          : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200'
      }`}
    >
      <div
        className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
          isConcentration ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'
        }`}
      >
        {isConcentration ? <ShieldAlert className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
      </div>

      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-1.5 font-semibold text-white">
          <span>{title}</span>
          <Sparkles className="w-3 h-3 text-indigo-400" />
        </div>
        <p className="leading-relaxed opacity-90">{message}</p>

        {(actionText || actionHref) && (
          <div className="pt-1">
            {actionHref ? (
              <Link
                to={actionHref}
                className="inline-flex items-center gap-1 font-semibold text-indigo-300 hover:text-white transition-colors"
              >
                <span>{actionText}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            ) : (
              <button
                onClick={onAction}
                className="inline-flex items-center gap-1 font-semibold text-indigo-300 hover:text-white transition-colors"
              >
                <span>{actionText}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
