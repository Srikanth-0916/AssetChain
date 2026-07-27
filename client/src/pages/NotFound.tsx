import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-white">404 — Page Not Found</h1>
      <p className="text-xs text-slate-400 max-w-sm">
        The requested page does not exist or has been moved.
      </p>
      <Link to="/" className="btn-primary text-xs py-2.5">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>
    </div>
  );
}
