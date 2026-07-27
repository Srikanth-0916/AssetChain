import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';
import { truncateAddress } from '../../lib/utils';
import {
  Coins,
  Wallet,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { address, isConnected, connect, isCorrectNetwork, switchToPolygonAmoy } = useWallet();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-indigo-500/10 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <span className="text-white">Asset<span className="text-indigo-400">Chain</span></span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <Link to="/marketplace" className="hover:text-indigo-400 transition-colors">Marketplace</Link>
          {isAuthenticated && (
            <>
              <Link to="/dashboard" className="hover:text-indigo-400 transition-colors">Dashboard</Link>
              {user?.role === 'investor' && (
                <Link to="/portfolio" className="hover:text-indigo-400 transition-colors">Portfolio</Link>
              )}
              {user?.role === 'asset_owner' && (
                <Link to="/my-assets" className="hover:text-indigo-400 transition-colors">My Assets</Link>
              )}
              {user?.role === 'admin' && (
                <Link to="/admin" className="hover:text-indigo-400 transition-colors">Admin Panel</Link>
              )}
            </>
          )}
        </nav>

        {/* Actions / Wallet & Auth */}
        <div className="flex items-center gap-3">
          {!isCorrectNetwork && isConnected && (
            <button
              onClick={switchToPolygonAmoy}
              className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-semibold hover:bg-amber-500/20 transition-all"
            >
              Switch to Amoy
            </button>
          )}

          {isConnected ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-indigo-500/20 px-3 py-1.5 rounded-xl text-xs text-indigo-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {truncateAddress(address)}
            </div>
          ) : (
            <button
              onClick={() => connect()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-semibold hover:bg-indigo-600/30 transition-all"
            >
              <Wallet className="w-3.5 h-3.5" />
              Connect Wallet
            </button>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <Link
                to="/profile"
                className="w-8 h-8 rounded-full bg-slate-800 border border-indigo-500/30 flex items-center justify-center text-slate-300 hover:text-white hover:border-indigo-400 transition-all"
                title={user?.full_name}
              >
                <UserIcon className="w-4 h-4" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-3.5 py-1.5 text-slate-300 hover:text-white text-xs font-medium transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary text-xs !py-1.5 !px-3.5">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
