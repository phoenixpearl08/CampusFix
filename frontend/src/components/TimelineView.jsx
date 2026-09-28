import React from 'react';
import { CheckCircle2, Clock, Bot, Shield, Wrench, UserCheck } from 'lucide-react';

function formatTimestamp(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function getRoleIcon(role) {
  switch (role) {
    case 'AI_SYSTEM':
      return <Bot className="w-3.5 h-3.5 text-pink-400" />;
    case 'ADMIN':
      return <Shield className="w-3.5 h-3.5 text-purple-400" />;
    case 'MAINTENANCE':
      return <Wrench className="w-3.5 h-3.5 text-amber-400" />;
    case 'STUDENT':
      return <UserCheck className="w-3.5 h-3.5 text-blue-400" />;
    default:
      return <Clock className="w-3.5 h-3.5 text-zinc-400" />;
  }
}

export default function TimelineView({ timeline = [], currentStatus }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-zinc-500">
        No lifecycle status transitions recorded yet.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-pink-500 before:via-purple-500/50 before:to-zinc-800">
      {timeline.map((item, idx) => {
        const isLatest = idx === timeline.length - 1;
        const isAi = item.changed_by_role === 'AI_SYSTEM';

        return (
          <div key={item.id || idx} className="relative group">
            {/* Timeline Node Dot */}
            <div
              className={`absolute -left-[27px] top-1 flex h-6 w-6 items-center justify-center rounded-full border ${
                isLatest
                  ? 'border-pink-500 bg-pink-950/80 shadow-[0_0_12px_rgba(236,72,153,0.5)]'
                  : isAi
                    ? 'border-pink-500/40 bg-zinc-900'
                    : 'border-zinc-700 bg-zinc-900'
              }`}
            >
              {isLatest ? (
                <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping"></span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
              )}
            </div>

            <div className={`rounded-xl border p-3.5 transition-all ${
              isLatest 
                ? 'border-pink-500/30 bg-[#161622]/90 shadow-pink-glow-sm' 
                : 'border-zinc-800/80 bg-[#121219]/60 hover:border-zinc-700'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white">
                    {item.new_status ? `Status: ${item.new_status}` : 'Status Update'}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-zinc-800/80 px-2 py-0.5 text-[10px] text-zinc-300 font-medium border border-zinc-700/60">
                    {getRoleIcon(item.changed_by_role)}
                    {item.changed_by_name || 'System'}
                  </span>
                </div>
                <time className="text-xs text-zinc-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  {formatTimestamp(item.created_at)}
                </time>
              </div>

              {item.notes && (
                <p className="text-xs text-zinc-300 leading-relaxed bg-black/30 p-2.5 rounded-lg border border-zinc-800/50 mt-2">
                  {item.notes}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
