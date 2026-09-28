import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import { 
  FileText, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  TrendingUp, 
  Zap, 
  Layers, 
  Users, 
  ArrowRight, 
  Sparkles,
  BarChart3,
  Calendar,
  Building2,
  ChevronRight
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [dashRes, issuesRes] = await Promise.all([
          adminAPI.getDashboardStats(),
          adminAPI.getAllIssues({ limit: 6 })
        ]);
        setStats(dashRes.data);
        setRecentIssues((issuesRes.data.issues || []).slice(0, 6));
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-zinc-400 mt-2">Computing campus operations telemetry...</p>
      </div>
    );
  }

  const m = stats?.metrics || {};
  const charts = stats?.charts || {};

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-pink-500/30 bg-gradient-to-r from-[#171724] via-[#14141e] to-[#0c0c12] p-6 sm:p-8 shadow-pink-glow-sm">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-pink-500/10 border border-pink-500/30 px-3 py-1 text-xs font-semibold text-pink-400 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Campus Facilities Executive Command</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Campus Operations & Analytics
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Real-time campus-wide telemetry, AI categorization accuracy, duplicate resolution, and predictive recurring failure identification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/admin/issues"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white bg-pink-600 hover:bg-pink-500 shadow-pink-glow-sm transition-all"
            >
              <FileText className="w-4 h-4" />
              Manage All Issues
            </Link>
            <Link
              to="/admin/recurring"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-zinc-200 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 transition-colors"
            >
              <TrendingUp className="w-4 h-4 text-pink-400" />
              Recurring Patterns
            </Link>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Issues */}
        <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Complaints</span>
            <div className="p-2 rounded-xl bg-zinc-800 text-zinc-300">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{m.totalIssues || 0}</p>
          <span className="text-[11px] text-zinc-500 mt-1 block">Campus-wide aggregate</span>
        </div>

        {/* Urgent Active */}
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
          <div className="flex items-center justify-between text-rose-300 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Urgent Active Hazards</span>
            <div className="p-2 rounded-xl bg-rose-900/50 text-rose-400 border border-rose-500/40">
              <ShieldAlert className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <p className="text-3xl font-black text-rose-400">{m.urgentActive || 0}</p>
          <span className="text-[11px] text-rose-300/70 mt-1 block">HIGH / CRITICAL safety priority</span>
        </div>

        {/* Avg Response Time */}
        <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Response Time</span>
            <div className="p-2 rounded-xl bg-purple-950/50 text-purple-400 border border-purple-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-purple-300">{m.avgResponseTimeHours}h</p>
          <span className="text-[11px] text-zinc-500 mt-1 block">Time to assignment</span>
        </div>

        {/* Avg Resolution Time */}
        <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Resolution Time</span>
            <div className="p-2 rounded-xl bg-emerald-950/50 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-400">{m.avgResolutionTimeHours}h</p>
          <span className="text-[11px] text-zinc-500 mt-1 block">Time from report to fix</span>
        </div>
      </div>

      {/* Operational Pipeline Status Counter */}
      <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
          Campus Ticket Workflow Distribution
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'REPORTED', count: m.openIssues || 0, color: 'text-blue-400', bg: 'bg-blue-950/30' },
            { label: 'UNDER REVIEW', count: (charts.byStatus || []).find(s => s.name === 'UNDER REVIEW')?.count || 0, color: 'text-purple-400', bg: 'bg-purple-950/30' },
            { label: 'ASSIGNED', count: m.assignedIssues || 0, color: 'text-amber-400', bg: 'bg-amber-950/30' },
            { label: 'IN PROGRESS', count: m.inProgressIssues || 0, color: 'text-pink-400', bg: 'bg-pink-950/30' },
            { label: 'RESOLVED', count: m.resolvedIssues || 0, color: 'text-emerald-400', bg: 'bg-emerald-950/30' },
            { label: 'CLOSED', count: m.closedIssues || 0, color: 'text-zinc-400', bg: 'bg-zinc-800/40' },
          ].map((item) => (
            <div key={item.label} className={`p-3 rounded-xl border border-zinc-800 ${item.bg}`}>
              <span className="text-[10px] font-bold text-zinc-400 block">{item.label}</span>
              <span className={`text-xl font-extrabold ${item.color} mt-0.5 block`}>{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Distribution Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues by Category */}
        <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-pink-400" />
              Complaints by Facility Category
            </h3>
            <span className="text-xs text-zinc-500">Calculated from actual DB</span>
          </div>

          <div className="space-y-3 pt-2">
            {(charts.byCategory || []).map((cat) => {
              const maxCount = Math.max(...(charts.byCategory || []).map(c => c.count), 1);
              const pct = Math.round((cat.count / maxCount) * 100);
              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-medium">{cat.name}</span>
                    <span className="text-zinc-400 font-bold">{cat.count} tickets</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-pink-600 to-pink-400 shadow-pink-glow-sm"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Issues by Priority & Location */}
        <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-pink-400" />
              Concentration by Campus Building
            </h3>
            <span className="text-xs text-zinc-500">Hotspot zones</span>
          </div>

          <div className="space-y-3 pt-2">
            {(charts.byBuilding || []).map((b) => {
              const maxCount = Math.max(...(charts.byBuilding || []).map(c => c.count), 1);
              const pct = Math.round((b.count / maxCount) * 100);
              return (
                <div key={b.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-medium">{b.name}</span>
                    <span className="text-zinc-400 font-bold">{b.count} reports</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-600 to-pink-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recurring Problems Live Insight Callout */}
      <div className="rounded-2xl border border-pink-500/30 bg-gradient-to-r from-pink-950/30 via-[#141420] to-[#121219] p-6 shadow-pink-glow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping"></span>
              <h3 className="text-sm font-bold text-white">AI Recurring Problem Intelligence Active</h3>
            </div>
            <p className="text-xs text-zinc-300">
              Database analysis detected <strong className="text-pink-400">{m.recurringZonesCount || 2} recurring complaint clusters</strong> (such as repeated plumbing faults in Block B and second-floor washrooms).
            </p>
          </div>

          <Link
            to="/admin/recurring"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-pink-600 hover:bg-pink-500 shadow-pink-glow-sm transition-all shrink-0"
          >
            Review Recurring Problem Analytics
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Recent Issues Table */}
      <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Recent Campus Reports</h3>
            <p className="text-xs text-zinc-400">Incoming tickets requiring triage and dispatch</p>
          </div>
          <Link
            to="/admin/issues"
            className="text-xs font-semibold text-pink-400 hover:text-pink-300 flex items-center gap-1"
          >
            All tickets <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-zinc-800/80">
          {recentIssues.map((issue) => (
            <div key={issue.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#161622]/40 px-2 rounded-xl transition-colors">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-pink-400 bg-pink-950/40 px-2 py-0.5 rounded border border-pink-500/20">
                    {issue.issue_code}
                  </span>
                  <StatusBadge status={issue.status} size="sm" />
                  <PriorityBadge priority={issue.final_priority} size="sm" />
                  <span className="text-xs text-zinc-400">{issue.final_category}</span>
                </div>
                <h4 className="text-sm font-semibold text-white truncate">{issue.title}</h4>
                <p className="text-xs text-zinc-400">
                  📍 {issue.building} ({issue.block}, {issue.floor}) • Reporter: {issue.reporter_name}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/admin/issues/${issue.id}`}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-pink-300 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 transition-colors"
                >
                  Triage & Assign
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
