import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import { Search, Filter, ArrowRight, MapPin, Calendar, Layers, ShieldAlert, GitMerge } from 'lucide-react';

const STATUS_OPTIONS = ['ALL', 'REPORTED', 'UNDER REVIEW', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITY_OPTIONS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const CATEGORY_OPTIONS = [
  'ALL',
  'Electrical',
  'Plumbing',
  'HVAC & Ventilation',
  'Furniture & Carpentry',
  'Sanitation & Hygiene',
  'IT & Wi-Fi Network',
  'Structural & Civil',
  'Safety & Security',
  'Grounds & Waste'
];

export default function AllIssues() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await adminAPI.getAllIssues(params);
      setIssues(res.data.issues || []);
    } catch (err) {
      console.error('Failed to load issues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [statusFilter, priorityFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchIssues();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Campus Issues Directory
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Complete management oversight of all student and faculty reported maintenance complaints.
          </p>
        </div>
        <div className="text-xs font-mono text-pink-400 bg-pink-950/40 border border-pink-500/30 px-3 py-1.5 rounded-lg">
          Total Records: {issues.length}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ticket code (e.g. CF-2026-00001), description, reporter name, room..."
              className="w-full rounded-xl border border-zinc-700 bg-[#161622] pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-800">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-[#161622] px-3 py-1.5 text-xs text-white focus:border-pink-500 focus:outline-none"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Priority Filter
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-[#161622] px-3 py-1.5 text-xs text-white focus:border-pink-500 focus:outline-none"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Category Filter
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-[#161622] px-3 py-1.5 text-xs text-white focus:border-pink-500 focus:outline-none"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Issues Table/Cards */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-zinc-400 mt-2">Loading campus tickets...</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-12 text-center text-zinc-400 text-xs">
          No complaints found matching current filter parameters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {issues.map((issue) => (
            <Link
              key={issue.id}
              to={`/admin/issues/${issue.id}`}
              className="group rounded-2xl border border-zinc-800/90 bg-[#121219] p-5 hover:border-pink-500/40 hover:bg-[#161622] transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-pink-400 bg-pink-950/40 px-2.5 py-0.5 rounded border border-pink-500/30">
                      {issue.issue_code}
                    </span>
                    <StatusBadge status={issue.status} size="sm" />
                    <PriorityBadge priority={issue.final_priority} size="sm" />
                    <span className="text-xs text-zinc-400">
                      Category: <strong className="text-zinc-200">{issue.final_category}</strong>
                    </span>
                    {issue.is_duplicate === 1 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded">
                        <GitMerge className="w-3 h-3" /> Duplicate
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-pink-300 transition-colors">
                    {issue.title}
                  </h3>

                  <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                    {issue.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-2 border-t border-zinc-800/60">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                      {issue.building} ({issue.block}, {issue.floor}{issue.room ? ` - ${issue.room}` : ''})
                    </span>
                    <span>•</span>
                    <span>Reporter: <strong className="text-zinc-300">{issue.reporter_name}</strong></span>
                    {issue.assigned_team_name && (
                      <>
                        <span>•</span>
                        <span className="text-pink-300">Team: <strong>{issue.assigned_team_name}</strong></span>
                      </>
                    )}
                  </div>
                </div>

                <div className="self-center sm:self-auto p-2.5 rounded-xl bg-zinc-800/40 text-zinc-400 group-hover:text-pink-400 group-hover:bg-pink-500/10 transition-colors shrink-0">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
