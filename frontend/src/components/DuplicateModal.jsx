import React from 'react';
import { AlertCircle, ExternalLink, GitMerge, PlusCircle, X } from 'lucide-react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';

export default function DuplicateModal({
  isOpen,
  onClose,
  duplicates = [],
  onCreateAnyway,
  onLinkDuplicate
}) {
  if (!isOpen || duplicates.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border border-pink-500/40 bg-[#121219] p-6 shadow-pink-glow-lg max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-400">
            <AlertCircle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Possible Existing Issue Found</h3>
            <p className="text-xs text-zinc-400">
              CampusFix AI detected active complaints in this location with high similarity.
            </p>
          </div>
        </div>

        <div className="space-y-4 my-5">
          {duplicates.map((dup) => (
            <div
              key={dup.issueId}
              className="rounded-xl border border-zinc-800 bg-[#171724]/90 p-4 transition-all hover:border-pink-500/30"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-pink-400 bg-pink-950/40 px-2 py-0.5 rounded border border-pink-500/30">
                    {dup.issueCode}
                  </span>
                  <StatusBadge status={dup.status} size="sm" />
                  <PriorityBadge priority={dup.priority} size="sm" showIcon={false} />
                </div>
                <div className="text-xs font-bold text-pink-400 bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-700">
                  {dup.similarityScore}% Match
                </div>
              </div>

              <h4 className="text-sm font-semibold text-white mb-1">{dup.title}</h4>
              <p className="text-xs text-zinc-300 line-clamp-2 mb-2">{dup.description}</p>

              <div className="text-xs text-zinc-400 mb-3 flex items-center gap-2">
                <span>📍 {dup.location}</span>
                <span>•</span>
                <span>Category: <strong className="text-zinc-200">{dup.category}</strong></span>
              </div>

              {dup.reasons && dup.reasons.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {dup.reasons.map((r, i) => (
                    <span key={i} className="text-[11px] bg-pink-950/20 text-pink-300 border border-pink-500/20 px-2 py-0.5 rounded-full">
                      ✓ {r}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => onLinkDuplicate(dup.issueId)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-pink-300 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 rounded-lg transition-colors"
                >
                  <GitMerge className="w-3.5 h-3.5" />
                  Link to this Issue ({dup.issueCode})
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-400">
            Reporting the same issue multiple times can fragment work tracking.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-lg transition-colors"
            >
              Cancel & Review
            </button>
            <button
              type="button"
              onClick={onCreateAnyway}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-pink-600 hover:bg-pink-500 rounded-lg shadow-pink-glow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              Create as New Issue Anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
