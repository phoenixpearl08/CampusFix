import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  Bell, 
  LogOut, 
  User, 
  Menu, 
  X, 
  Sparkles, 
  Shield, 
  Wrench, 
  GraduationCap,
  CheckCheck
} from 'lucide-react';

export default function Navbar({ onMobileMenuToggle, isMobileMenuOpen }) {
  const { user, role, logout } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = () => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-950/60 border border-purple-500/40 px-2.5 py-0.5 text-xs font-semibold text-purple-300">
            <Shield className="w-3 h-3 text-purple-400" />
            Admin
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/60 border border-amber-500/40 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
            <Wrench className="w-3 h-3 text-amber-400" />
            Maintenance
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-pink-950/60 border border-pink-500/40 px-2.5 py-0.5 text-xs font-semibold text-pink-300">
            <GraduationCap className="w-3 h-3 text-pink-400" />
            Student / Staff
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#09090c]/90 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-4">
          {user && (
            <button
              onClick={onMobileMenuToggle}
              className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-pink-600 to-pink-400 p-0.5 shadow-pink-glow-sm group-hover:shadow-pink-glow transition-all">
              <div className="h-full w-full rounded-[10px] bg-[#09090c] flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-pink-400" />
              </div>
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white group-hover:text-pink-400 transition-colors">
                CAMPUS<span className="text-pink-500">FIX</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                AI Smart Operations
              </span>
            </div>
          </Link>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Role badge */}
              <div className="hidden sm:block">
                {getRoleBadge()}
              </div>

              {/* In-App Notifications Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-bold text-white shadow-pink-glow-sm">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-zinc-800 bg-[#121219] p-3 shadow-2xl backdrop-blur-xl animate-fadeIn z-50">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2 px-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Campus Alerts</h4>
                        {unreadCount > 0 && (
                          <span className="text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-full font-bold">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[11px] text-pink-400 hover:text-pink-300 flex items-center gap-1 font-medium"
                        >
                          <CheckCheck className="w-3 h-3" /> Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-zinc-500">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              if (!n.is_read) markRead(n.id);
                              if (n.issue_id) {
                                setShowNotifications(false);
                                if (role === 'ADMIN') navigate(`/admin/issues/${n.issue_id}`);
                                else if (role === 'MAINTENANCE') navigate(`/maintenance/issues/${n.issue_id}`);
                                else navigate(`/issues/${n.issue_id}`);
                              }
                            }}
                            className={`p-2.5 rounded-xl cursor-pointer transition-colors border ${
                              n.is_read
                                ? 'bg-zinc-900/40 border-transparent hover:border-zinc-800'
                                : 'bg-[#181826] border-pink-500/30 hover:border-pink-500/50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="text-xs font-semibold text-white leading-tight">
                                {n.title}
                              </h5>
                              <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-300 mt-1 line-clamp-2">
                              {n.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User profile & Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
                <Link
                  to={role === 'ADMIN' ? '/admin/dashboard' : role === 'MAINTENANCE' ? '/maintenance/dashboard' : '/dashboard'}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-zinc-800/80 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 font-bold text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-medium text-white leading-tight">{user.name}</p>
                    <p className="text-[10px] text-zinc-400">{user.email}</p>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-xs font-semibold text-zinc-300 hover:text-white px-3 py-2 rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-bold text-white bg-pink-600 hover:bg-pink-500 px-4 py-2 rounded-xl shadow-pink-glow-sm hover:shadow-pink-glow transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
