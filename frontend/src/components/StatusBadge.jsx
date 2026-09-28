import React from 'react';

const STATUS_CONFIG = {
  'REPORTED': {
    label: 'Reported',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    dot: 'bg-blue-400',
  },
  'UNDER REVIEW': {
    label: 'Under Review',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-300',
    dot: 'bg-purple-400',
  },
  'ASSIGNED': {
    label: 'Assigned',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
  },
  'IN PROGRESS': {
    label: 'In Progress',
    bg: 'bg-pink-500/15',
    border: 'border-pink-500/40',
    text: 'text-pink-300',
    dot: 'bg-pink-400 animate-pulse',
  },
  'RESOLVED': {
    label: 'Resolved',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
  'CLOSED': {
    label: 'Closed',
    bg: 'bg-zinc-700/20',
    border: 'border-zinc-700',
    text: 'text-zinc-400',
    dot: 'bg-zinc-500',
  },
};

export default function StatusBadge({ status, size = 'md' }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    bg: 'bg-zinc-800',
    border: 'border-zinc-700',
    text: 'text-zinc-300',
    dot: 'bg-zinc-400'
  };

  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2.5 py-0.5' 
    : size === 'lg' 
      ? 'text-sm px-4 py-1.5 font-semibold' 
      : 'text-xs px-3 py-1 font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.border} ${config.text} ${sizeClasses} backdrop-blur-sm transition-all duration-200`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
}
