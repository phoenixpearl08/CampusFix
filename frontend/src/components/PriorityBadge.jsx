import React from 'react';
import { AlertTriangle, AlertOctagon, ShieldAlert, CheckCircle } from 'lucide-react';

const PRIORITY_CONFIG = {
  'CRITICAL': {
    label: 'Critical',
    bg: 'bg-rose-950/40',
    border: 'border-rose-500/50',
    text: 'text-rose-400',
    glow: 'shadow-[0_0_12px_rgba(244,63,94,0.3)]',
    icon: AlertOctagon,
  },
  'HIGH': {
    label: 'High',
    bg: 'bg-amber-950/40',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    glow: '',
    icon: ShieldAlert,
  },
  'MEDIUM': {
    label: 'Medium',
    bg: 'bg-sky-950/40',
    border: 'border-sky-500/40',
    text: 'text-sky-300',
    glow: '',
    icon: AlertTriangle,
  },
  'LOW': {
    label: 'Low',
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-500/30',
    text: 'text-emerald-300',
    glow: '',
    icon: CheckCircle,
  },
};

export default function PriorityBadge({ priority, showIcon = true, size = 'md' }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG['MEDIUM'];
  const Icon = config.icon;

  const sizeClasses = size === 'sm'
    ? 'text-[11px] px-2 py-0.5'
    : size === 'lg'
      ? 'text-sm px-3.5 py-1.5 font-bold'
      : 'text-xs px-2.5 py-1 font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border uppercase tracking-wider ${config.bg} ${config.border} ${config.text} ${config.glow} ${sizeClasses} backdrop-blur-sm`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      {config.label}
    </span>
  );
}
