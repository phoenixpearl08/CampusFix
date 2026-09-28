import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { issueAPI } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import { 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ArrowRight, 
  Sparkles,
  Search,
  ExternalLink,
  MapPin
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await issueAPI.getMyIssues();
        setIssues(res.data.issues || []);
        setStats(res.data.stats || { total: 0, pending: 0, in_progress: 0, resolved: 0 });
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-pink-500/30 bg-gradient-to-r from-[#171724] via-[#13131c] to-[#0c0c12] p-6 sm:p-8 shadow-pink-glow-sm">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-pink-500/10 border border-pink-500/30 px-3 py-1 text-xs font-semibold text-pink-400 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Campus Facility Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Hello, {user?.name || 'Student'} 👋
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Track your reported facility complaints, review AI priority classifications, and verify completed maintenance repairs.
            </p>
          </div>

          <Link
            to="/report"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white bg-pink-600 hover:bg-pink-500 shadow-pink-glow hover:shadow-pink-glow-lg transition-all scale-100 hover:scale-105 shrink-0"
          >
            <PlusCircle className="w-5 h-5" />
            Report New Problem
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Reports</span>
            <div className="p-2 rounded-xl bg-zinc-800/80 text-zinc-300">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">{stats.total || 0}</p>
          <span className="text-[11px] text-zinc-500 mt-1 block">All logged complaints</span>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Under Review</span>
            <div className="p-2 rounded-xl bg-purple-950/50 text-purple-400 border border-purple-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-purple-300">{stats.pending || 0}</p>
          <span className="text-[11px] text-zinc-500 mt-1 block">Awaiting assignment</span>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">In Progress</span>
            <div className="p-2 rounded-xl bg-pink-950/50 text-pink-400 border border-pink-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-pink-400">{stats.in_progress || 0}</p>
          <span className="text-[11px] text-zinc-500 mt-1 block">Active field repairs</span>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Resolved</span>
            <div className="p-2 rounded-xl bg-emerald-950/50 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-400">{stats.resolved || 0}</p>
          <span className="text-[11px] text-zinc-500 mt-1 block">Repairs completed</span>
        </div>
      </div>

      {/* Recent Issues Section */}
      <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Complaints & Status</h2>
            <p className="text-xs text-zinc-400">Chronological history of your reported campus concerns</p>
          </div>
          <Link
            to="/my-issues"
            className="text-xs font-semibold text-pink-400 hover:text-pink-300 flex items-center gap-1 transition-colors"
          >
            View all ({issues.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-zinc-400 mt-2">Loading your campus issues...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center">
            <FileText className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white">No issues reported yet</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto mb-4">
              Noticed broken lights, leaking faucets, or damaged classroom desks? Report them to notify facility teams immediately.
            </p>
            <Link
              to="/report"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-pink-600 hover:bg-pink-500 shadow-pink-glow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              Report First Issue
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                to={`/issues/${item.id}`}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-800/80 bg-[#161622]/60 hover:border-pink-500/40 hover:bg-[#181826] transition-all"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-pink-400 bg-pink-950/40 px-2 py-0.5 rounded border border-pink-500/20">
                      {item.issue_code}
                    </span>
                    <StatusBadge status={item.status} size="sm" />
                    <PriorityBadge priority={item.final_priority} size="sm" />
                    <span className="text-xs text-zinc-400 font-medium">
                      Category: <strong className="text-zinc-300">{item.final_category}</strong>
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors truncate">
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span>{item.building} ({item.block}, {item.floor}{item.room ? ` - ${item.room}` : ''})</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                  <span className="text-xs text-zinc-400">
                    {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="p-2 rounded-lg bg-zinc-800/50 text-zinc-400 group-hover:text-pink-400 group-hover:bg-pink-500/10 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
