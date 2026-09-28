import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { issueAPI } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import { 
  Search, 
  Filter, 
  PlusCircle, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  FileQuestion,
  Layers
} from 'lucide-react';

const STATUS_FILTERS = [
  'ALL',
  'REPORTED',
  'UNDER REVIEW',
  'ASSIGNED',
  'IN PROGRESS',
  'RESOLVED',
  'CLOSED'
];

export default function MyIssues() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('');

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (selectedCategory) params.category = selectedCategory;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await issueAPI.getMyIssues(params);
      setIssues(res.data.issues || []);
    } catch (err) {
      console.error('Failed to fetch issues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [selectedStatus, selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchIssues();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            My Reported Issues
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Monitor the progress and resolution status of all maintenance complaints submitted from your account.
          </p>
        </div>

        <Link
          to="/report"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-pink-600 hover:bg-pink-500 shadow-pink-glow-sm hover:shadow-pink-glow transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Report Issue
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-4 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, ticket code (e.g. CF-2026-00001), building, or room..."
              className="w-full rounded-xl border border-zinc-700 bg-[#161622] pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mr-2 shrink-0">
            Status:
          </span>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedStatus(s)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStatus === s
                  ? 'bg-pink-600 text-white shadow-pink-glow-sm'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Issues List */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-zinc-400 mt-2">Retrieving records...</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-12 text-center">
          <FileQuestion className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No complaints match your criteria</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto mb-6">
            Try adjusting your search terms or status filters.
          </p>
          {(searchTerm || selectedStatus !== 'ALL') && (
            <button
              type="button"
              onClick={() => { setSearchTerm(''); setSelectedStatus('ALL'); }}
              className="text-xs text-pink-400 hover:underline font-semibold"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {issues.map((issue) => (
            <Link
              key={issue.id}
              to={`/issues/${issue.id}`}
              className="group rounded-2xl border border-zinc-800/80 bg-[#121219] p-5 hover:border-pink-500/40 hover:bg-[#161622] transition-all hover:shadow-pink-glow-sm"
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
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      Reported: {new Date(issue.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {issue.assigned_team_name && (
                      <span className="flex items-center gap-1.5 text-pink-300 font-medium">
                        <Layers className="w-3.5 h-3.5 text-pink-400" />
                        Team: {issue.assigned_team_name}
                      </span>
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
