import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { maintenanceAPI } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import { 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  MapPin, 
  Sparkles, 
  ShieldAlert,
  Play
} from 'lucide-react';

export default function MaintenanceDashboard() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({ total: 0, assigned: 0, in_progress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await maintenanceAPI.getMyAssignedIssues();
        setIssues(res.data.issues || []);
        setStats(res.data.stats || { total: 0, assigned: 0, in_progress: 0, resolved: 0 });
      } catch (err) {
        console.error('Failed to load maintenance dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-r from-[#171724] via-[#14141d] to-[#0c0c12] p-6 sm:p-8 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-400 mb-2">
              <Wrench className="w-3.5 h-3.5" />
              <span>Campus Field Operations & Repairs</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Field Technician Workspace
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Manage your assigned campus repairs, execute emergency containment, post progress notes, and upload photo completion proof.
            </p>
          </div>

          <Link
            to="/maintenance/assigned"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white bg-pink-600 hover:bg-pink-500 shadow-pink-glow transition-all"
          >
            View All Assigned Issues
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Queue</span>
            <div className="p-2 rounded-xl bg-zinc-800 text-zinc-300">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">{stats.total || 0}</p>
          <span className="text-[11px] text-zinc-500 mt-1 block">Assigned to your team</span>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">New (Assigned)</span>
            <div className="p-2 rounded-xl bg-amber-950/40 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-amber-300">{stats.assigned || 0}</p>
          <span className="text-[11px] text-zinc-500 mt-1 block">Awaiting work start</span>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">In Progress</span>
            <div className="p-2 rounded-xl bg-pink-950/40 text-pink-400 border border-pink-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-pink-400">{stats.in_progress || 0}</p>
          <span className="text-[11px] text-zinc-500 mt-1 block">Active on-site repairs</span>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Resolved</span>
            <div className="p-2 rounded-xl bg-emerald-950/40 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-400">{stats.resolved || 0}</p>
          <span className="text-[11px] text-zinc-500 mt-1 block">Completed work</span>
        </div>
      </div>

      {/* Urgent Tasks Section */}
      <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Active Assigned Tasks</h2>
            <p className="text-xs text-zinc-400">Prioritized by danger and operational urgency</p>
          </div>
          <Link
            to="/maintenance/assigned"
            className="text-xs font-semibold text-pink-400 hover:text-pink-300 flex items-center gap-1 transition-colors"
          >
            View all ({issues.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-zinc-400 mt-2">Loading assignments...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-500/60 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-white">No pending assignments</h3>
            <p className="text-xs text-zinc-400 mt-1">Your team's maintenance queue is completely clear!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                to={`/maintenance/issues/${item.id}`}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-800/80 bg-[#161622]/60 hover:border-pink-500/40 hover:bg-[#181826] transition-all"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-pink-400 bg-pink-950/40 px-2 py-0.5 rounded border border-pink-500/20">
                      {item.issue_code}
                    </span>
                    <StatusBadge status={item.status} size="sm" />
                    <PriorityBadge priority={item.final_priority} size="sm" />
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors truncate">
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span>{item.building} ({item.block}, {item.floor}{item.room ? ` - ${item.room}` : ''})</span>
                    <span>•</span>
                    <span>Reporter: {item.reporter_name}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                  <span className="text-xs font-semibold text-pink-400 bg-pink-950/30 px-3 py-1.5 rounded-lg border border-pink-500/20 group-hover:bg-pink-600 group-hover:text-white transition-all">
                    Open Issue
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
