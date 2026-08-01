import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';
import { truncateAddress } from '../../lib/utils';
import { NotificationBell } from './NotificationBell';
import { GlobalSearchModal } from '../system/GlobalSearchModal';
import { getRoleWorkspaceTitle, getRoleDashboardPath } from '../../utils/roleUtils';
import {
  Coins, Wallet, LogOut, User as UserIcon, Sparkles, BarChart3,
  LayoutDashboard, Store, PieChart, Star, Activity, Vote, Search,
  Trophy, Map, Receipt, Menu, X, Shield, ChevronDown, Users, Cpu,
  FileCheck2, ShieldCheck
} from 'lucide-react';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  description?: string;
  roles?: string[];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Control Center', to: '/investor',      icon: <LayoutDashboard className="w-4 h-4 text-emerald-400" /> },
  { label: 'Marketplace',    to: '/marketplace',   icon: <Store className="w-4 h-4" /> },
  { label: 'Portfolio',      to: '/portfolio',     icon: <PieChart className="w-4 h-4 text-indigo-400" />, roles: ['investor', 'asset_owner', 'admin'] },
  { label: 'AI Advisor',     to: '/ai-copilot',    icon: <Sparkles className="w-4 h-4 text-purple-400" />, badge: 'AI' },
  { label: 'Activity',       to: '/activity',      icon: <Activity className="w-4 h-4 text-amber-400" /> },
];

const MORE_ITEMS: NavItem[] = [
  { label: 'Admin Control Center',      to: '/admin',       icon: <Shield className="w-4 h-4 text-red-400" />,      description: 'Platform operations & system health', roles: ['admin'] },
  { label: 'Verifier Control Center',   to: '/verifier',    icon: <FileCheck2 className="w-4 h-4 text-emerald-400" />, description: 'Deed review & OCR scanner', roles: ['verifier', 'admin'] },
  { label: 'Legal Control Center',      to: '/legal',       icon: <ShieldCheck className="w-4 h-4 text-blue-400" />,   description: 'Encumbrance & litigation search', roles: ['legal_reviewer', 'admin'] },
  { label: 'Compliance Control Center', to: '/compliance',  icon: <Users className="w-4 h-4 text-amber-400" />,     description: 'KYC, AML & ERC-3643 whitelist', roles: ['compliance_officer', 'compliance', 'admin'] },
  { label: 'Auditor Control Center',    to: '/auditor',     icon: <Receipt className="w-4 h-4 text-cyan-400" />,    description: 'Read-only security ledger', roles: ['auditor', 'admin'] },
  { label: 'IoT Oracles',               to: '/oracles',     icon: <Cpu className="w-4 h-4 text-cyan-400" />,        description: 'Chainlink property feeds' },
  { label: 'Transactions',              to: '/transactions',icon: <Receipt className="w-4 h-4 text-purple-400" />,  description: 'On-chain transaction ledger' },
];

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { address, isConnected, connect, isCorrectNetwork, switchToPolygonAmoy } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen]     = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setMobileOpen(false);
  };

  function isActive(to: string) {
    return location.pathname === to || location.pathname.startsWith(to + '/');
  }

  function canShow(item: NavItem) {
    if (!item.roles) return true;
    return item.roles.includes(user?.role ?? '');
  }

  const visibleNav  = NAV_ITEMS.filter(canShow);
  const visibleMore = MORE_ITEMS.filter(canShow);
  const isMoreChildActive = visibleMore.some(item => isActive(item.to));

  return (
    <>
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-white/[0.06] px-4 lg:px-8 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white hidden sm:block">
              Asset<span className="text-indigo-400">Chain</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          {isAuthenticated && (
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              {visibleNav.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all
                    ${isActive(item.to)
                      ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                >
                  {item.icon}
                  {item.label}
                  {item.badge && (
                    <span className="ml-0.5 px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 text-[10px] font-bold border border-indigo-500/20">
                      {item.badge}
                    </span>
                  )}
                  {isActive(item.to) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  )}
                </Link>
              ))}

              {/* More dropdown */}
              {visibleMore.length > 0 && (
                <div
                  className="relative"
                  onMouseEnter={() => setMoreOpen(true)}
                  onMouseLeave={() => setMoreOpen(false)}
                >
                  <button
                    onClick={() => setMoreOpen(v => !v)}
                    className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all
                      ${isMoreChildActive
                        ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                        : moreOpen ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                  >
                    More <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`} />
                    {isMoreChildActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    )}
                  </button>

                  {moreOpen && (
                    <div className="absolute top-full right-0 lg:left-0 mt-1.5 w-64 bg-slate-900/95 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-2 shadow-2xl shadow-indigo-950/80 animate-fade-scale z-50">
                      <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                        Platform Features
                      </div>
                      {visibleMore.map(item => {
                        const itemActive = isActive(item.to);
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            className={`flex items-start gap-3 p-2.5 rounded-xl transition-all group
                              ${itemActive
                                ? 'bg-indigo-500/15 text-indigo-200 border border-indigo-500/20'
                                : 'hover:bg-slate-800/60 text-slate-300 hover:text-white'}`}
                            onClick={() => setMoreOpen(false)}
                          >
                            <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50 group-hover:scale-105 transition-transform shrink-0">
                              {item.icon}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold flex items-center gap-1.5">
                                {item.label}
                                {itemActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                              </div>
                              {item.description && (
                                <p className="text-xs text-slate-400 group-hover:text-slate-300 truncate">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </nav>
          )}

          {/* Right section */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Network warning */}
            {!isCorrectNetwork && isConnected && (
              <button
                onClick={switchToPolygonAmoy}
                className="hidden sm:flex px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-semibold hover:bg-amber-500/20 transition-all"
              >
                Switch Network
              </button>
            )}

            {/* Wallet */}
            {isConnected ? (
              <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-indigo-500/20 px-2.5 py-1.5 rounded-xl text-xs text-indigo-300 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                {truncateAddress(address)}
              </div>
            ) : (
              <button
                onClick={() => connect()}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-semibold hover:bg-indigo-600/30 transition-all"
              >
                <Wallet className="w-3.5 h-3.5" />
                Connect
              </button>
            )}

            {/* Global Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/[0.1] text-slate-400 hover:text-white hover:border-indigo-500/30 text-xs transition-all"
              title="Global Search (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline font-medium">Search...</span>
              <kbd className="hidden md:inline px-1 py-0.5 rounded bg-slate-800 text-[10px] text-slate-500 font-mono">⌘K</kbd>
            </button>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Profile / Auth */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1 pl-2 border-l border-white/[0.06]">
                <Link
                  to="/profile"
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all
                    ${isActive('/profile')
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                      : 'bg-slate-800 border-slate-700/50 text-slate-400 hover:text-white hover:border-indigo-500/40'
                    }`}
                  title={user?.full_name}
                >
                  <UserIcon className="w-4 h-4" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login"    className="text-slate-300 hover:text-white text-sm font-medium transition-colors px-2 py-1.5">Sign In</Link>
                <Link to="/register" className="btn-primary text-xs !py-1.5 !px-3">Get Started</Link>
              </div>
            )}

            {/* Mobile hamburger */}
            {isAuthenticated && (
              <button
                className="lg:hidden p-1.5 text-slate-400 hover:text-white transition-colors ml-1"
                onClick={() => setMobileOpen(v => !v)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile Nav Drawer ── */}
      {mobileOpen && isAuthenticated && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute left-0 top-0 h-full w-72 bg-slate-950 border-r border-white/[0.06] py-6 px-4 overflow-y-auto animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Brand */}
            <div className="flex items-center gap-2.5 mb-6 px-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center">
                <Coins className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Asset<span className="text-indigo-400">Chain</span></span>
            </div>

            {/* User pill */}
            <div className="mb-6 px-3 py-3 rounded-xl bg-slate-900/80 border border-white/[0.06]">
              <div className="font-semibold text-white text-sm">{user?.full_name}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="level-badge level-gold text-xs">🥇 Gold Investor</span>
              </div>
            </div>

            {/* Nav items */}
            <div className="space-y-1">
              {[...visibleNav, ...visibleMore].map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${isActive(item.to)
                      ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {item.icon}
                  {item.label}
                  {item.badge && (
                    <span className="ml-auto px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[10px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Bottom actions */}
            <div className="mt-6 pt-4 border-t border-white/[0.06] space-y-2">
              {isConnected ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900/50 border border-indigo-500/15 text-xs text-indigo-300 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {truncateAddress(address)}
                </div>
              ) : (
                <button onClick={() => { connect(); setMobileOpen(false); }} className="btn-secondary w-full text-sm py-2">
                  <Wallet className="w-4 h-4" /> Connect Wallet
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
