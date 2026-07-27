import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Coins, Vote, Shield, AlertTriangle, Info, X } from 'lucide-react';
import { notificationApiService } from '../../services/platformServices';
import { useAuth } from '../../contexts/AuthContext';

const typeIcons: Record<string, React.ReactNode> = {
  dividend_available: <Coins className="w-3.5 h-3.5 text-amber-400" />,
  proposal_created: <Vote className="w-3.5 h-3.5 text-purple-400" />,
  kyc_approved: <Shield className="w-3.5 h-3.5 text-emerald-400" />,
  kyc_rejected: <AlertTriangle className="w-3.5 h-3.5 text-red-400" />,
  asset_approved: <Shield className="w-3.5 h-3.5 text-indigo-400" />,
  fraud_alert: <AlertTriangle className="w-3.5 h-3.5 text-red-400" />,
  purchase_confirmed: <Coins className="w-3.5 h-3.5 text-emerald-400" />,
};

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationApiService.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      load();
      const interval = setInterval(load, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    await notificationApiService.markRead(id).catch(() => {});
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          id="notification-dropdown"
          className="absolute right-0 top-full mt-2 w-80 glass-card border border-slate-700/60 shadow-2xl shadow-slate-950/50 z-50 overflow-hidden animate-fade-in"
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <span className="text-sm font-bold text-white">Notifications</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
                  {unreadCount} unread
                </span>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                <Bell className="w-6 h-6 mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 p-3.5 border-b border-slate-800/50 hover:bg-slate-800/40 transition-all cursor-pointer ${
                    !notif.read ? 'bg-slate-800/20' : ''
                  }`}
                  onClick={() => !notif.read && handleMarkRead(notif.id)}
                >
                  <div className="flex-shrink-0 w-7 h-7 rounded-xl bg-slate-800 flex items-center justify-center mt-0.5">
                    {typeIcons[notif.type] || <Info className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-white leading-tight">{notif.title}</span>
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{notif.message}</p>
                    <span className="text-[10px] text-slate-600 mt-1 block">
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-800 flex justify-center">
              <button
                onClick={() => {
                  notifications.filter((n) => !n.read).forEach((n) => handleMarkRead(n.id));
                }}
                className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
