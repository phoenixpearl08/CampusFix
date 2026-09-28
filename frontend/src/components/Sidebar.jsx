import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  Wrench, 
  BarChart3, 
  Users, 
  ShieldAlert, 
  TrendingUp, 
  User, 
  Layers
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { role } = useAuth();

  const getNavLinks = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { to: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
          { to: '/admin/issues', label: 'All Campus Issues', icon: FileText },
          { to: '/admin/recurring', label: 'Recurring Problems', icon: TrendingUp, highlight: true },
          { to: '/admin/teams', label: 'Maintenance Teams', icon: Layers },
          { to: '/admin/users', label: 'User Directory', icon: Users },
          { to: '/profile', label: 'My Account', icon: User },
        ];
      case 'MAINTENANCE':
        return [
          { to: '/maintenance/dashboard', label: 'Team Dashboard', icon: LayoutDashboard },
          { to: '/maintenance/assigned', label: 'Assigned Issues', icon: Wrench },
          { to: '/profile', label: 'My Account', icon: User },
        ];
      default: // STUDENT / STAFF
        return [
          { to: '/dashboard', label: 'Student Dashboard', icon: LayoutDashboard },
          { to: '/report', label: 'Report Issue', icon: PlusCircle, isCta: true },
          { to: '/my-issues', label: 'My Reported Issues', icon: FileText },
          { to: '/profile', label: 'My Account', icon: User },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-zinc-800/80 bg-[#0c0c12]/95 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col justify-between p-4">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
              {role === 'ADMIN' ? 'Administration' : role === 'MAINTENANCE' ? 'Field Work' : 'Campus Portal'}
            </div>

            {navLinks.map((item) => {
              const Icon = item.icon;
              if (item.isCta) {
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3.5 py-2.5 my-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-pink-600 to-pink-500 shadow-pink-glow-sm hover:shadow-pink-glow hover:scale-[1.02] transition-all"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-pink-500/10 text-pink-400 border border-pink-500/30 font-semibold shadow-[0_0_15px_rgba(236,72,153,0.15)]'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.highlight && (
                    <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping"></span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Quick campus status info widget */}
          <div className="rounded-xl border border-zinc-800 bg-[#121219] p-3 text-xs text-zinc-400">
            <div className="flex items-center justify-between mb-1">
              <span className="text-zinc-300 font-semibold">CampusFix AI</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Operational
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Real-time duplicate detection & instant priority classification active.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
