import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { 
  TrendingUp, 
  AlertTriangle, 
  MapPin, 
  Layers, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles,
  Calendar,
  Building2,
  HelpCircle,
  Clock
} from 'lucide-react';

export default function RecurringProblems() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecurring() {
      try {
        setLoading(true);
        const res = await adminAPI.getRecurringProblems();
        setData(res.data);
      } catch (err) {
        console.error('Failed to load recurring problems:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRecurring();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-zinc-400 mt-2">Computing historical complaint clusters...</p>
      </div>
    );
  }

  const summary = data?.summary || {};
  const insights = data?.insights || [];
  const categoryClusters = data?.categoryClusters || [];
  const roomHotspots = data?.roomHotspots || [];

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-pink-500/30 bg-gradient-to-r from-[#171724] via-[#14141e] to-[#0c0c12] p-6 sm:p-8 shadow-pink-glow-sm">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-pink-500/10 border border-pink-500/30 px-3 py-1 text-xs font-semibold text-pink-400 mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Root-Cause Predictive Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Campus Recurring Problem Analysis
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Derived directly from database records. Identifies chronic infrastructure hotspots, recurring category failures, and systemic facility degradation before major disruptions occur.
          </p>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-5">
          <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block mb-1">
            Recurring Zone Clusters
          </span>
          <p className="text-3xl font-black text-pink-400">{summary.totalRecurringZones || 0}</p>
          <span className="text-[11px] text-zinc-500 mt-1 block">Repeated failures by Block/Category</span>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-5">
          <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block mb-1">
            Specific Room Hotspots
          </span>
          <p className="text-3xl font-black text-amber-400">{summary.specificHotspots || 0}</p>
          <span className="text-[11px] text-zinc-500 mt-1 block">Pinpointed fixtures/rooms with &gt;1 complaint</span>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-5">
          <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block mb-1">
            Highest Frequency Facility
          </span>
          <p className="text-xl font-bold text-white truncate">{summary.highestFrequencyBuilding || 'None'}</p>
          <span className="text-[11px] text-zinc-500 mt-1 block">Most frequent complaint locus</span>
        </div>
      </div>

      {/* Actionable Insights Section */}
      <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-6 shadow-xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white">Algorithmic Pattern Insights</h2>
          <p className="text-xs text-zinc-400">Database clustering calculated across all active and resolved complaints</p>
        </div>

        {insights.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl text-xs text-zinc-400">
            No recurring problem patterns detected yet in the database.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((item, idx) => (
              <div
                key={item.id ? `${item.id}-${idx}` : `insight-${idx}`}
                className={`rounded-2xl border p-5 space-y-3 transition-all ${
                  item.severity === 'CRITICAL_ZONE'
                    ? 'border-rose-500/40 bg-rose-950/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                    : 'border-amber-500/30 bg-amber-950/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    item.severity === 'CRITICAL_ZONE'
                      ? 'bg-rose-900/60 border-rose-500/40 text-rose-300'
                      : 'bg-amber-900/60 border-amber-500/40 text-amber-300'
                  }`}>
                    {item.severity === 'CRITICAL_ZONE' ? '🚨 Critical Chronic Zone' : '⚠️ Elevated Frequency'}
                  </span>

                  <span className="text-xs font-mono font-bold text-white bg-black/40 px-2.5 py-1 rounded-lg border border-zinc-700">
                    {item.totalCount} complaints logged
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">{item.title}</h3>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  {item.description}
                </p>

                <div className="rounded-xl border border-zinc-700/60 bg-black/40 p-3 text-xs">
                  <strong className="text-pink-300 block mb-1">Preventative Recommendation:</strong>
                  <span className="text-zinc-300">{item.recommendation}</span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400">
                  <span>Category: <strong className="text-zinc-200">{item.category}</strong></span>
                  <span>Active: <strong className="text-rose-400">{item.activeCount}</strong> • Resolved: <strong className="text-emerald-400">{item.resolvedCount}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Cluster Breakdown */}
      <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white">Building & Category Recurrence Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-[#161622] text-[11px] uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3">Campus Building</th>
                <th className="px-4 py-3">Block / Wing</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">Total Incidents</th>
                <th className="px-4 py-3 text-center">Active Now</th>
                <th className="px-4 py-3 text-center">Resolved</th>
                <th className="px-4 py-3">Latest Incident</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {categoryClusters.map((row, idx) => (
                <tr key={idx} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-white">{row.building}</td>
                  <td className="px-4 py-3 text-zinc-300">{row.block}</td>
                  <td className="px-4 py-3">
                    <span className="bg-pink-950/40 text-pink-300 border border-pink-500/20 px-2 py-0.5 rounded text-[11px]">
                      {row.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-white">{row.total_count}</td>
                  <td className="px-4 py-3 text-center font-bold text-rose-400">{row.active_count}</td>
                  <td className="px-4 py-3 text-center font-bold text-emerald-400">{row.resolved_count}</td>
                  <td className="px-4 py-3 text-zinc-500 font-mono text-[11px]">
                    {new Date(row.latest_reported_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
