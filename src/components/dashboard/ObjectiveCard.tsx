'use client';

import { ObjectiveWithChildren } from '@/types';
import { Calendar, ChevronRight } from 'lucide-react';

interface Props {
  objective: ObjectiveWithChildren;
  isSelected: boolean;
  onClick: () => void;
  colorIndex: number;
}

const CARD_COLORS = [
  { border: 'border-orange-400', progress: 'bg-orange-400', text: 'text-orange-500' },
  { border: 'border-teal-400', progress: 'bg-teal-400', text: 'text-teal-500' },
  { border: 'border-rose-400', progress: 'bg-rose-400', text: 'text-rose-400' },
  { border: 'border-blue-400', progress: 'bg-blue-400', text: 'text-blue-500' },
  { border: 'border-purple-400', progress: 'bg-purple-400', text: 'text-purple-500' },
  { border: 'border-amber-400', progress: 'bg-amber-400', text: 'text-amber-500' },
];

function getProgressColor(pct: number) {
  if (pct >= 70) return 'text-emerald-500';
  if (pct >= 30) return 'text-orange-500';
  return 'text-rose-500';
}

function getProgressBarColor(pct: number) {
  if (pct >= 70) return 'bg-emerald-500';
  if (pct >= 30) return 'bg-orange-400';
  return 'bg-rose-400';
}

export function ObjectiveCard({ objective, isSelected, onClick, colorIndex }: Props) {
  const color = CARD_COLORS[colorIndex % CARD_COLORS.length];

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left rounded-xl border-2 p-6 transition-all duration-200
        bg-white hover:shadow-lg cursor-pointer group relative
        ${isSelected ? `${color.border} shadow-md` : 'border-gray-200 hover:border-gray-300'}
      `}
    >
      {/* Title */}
      <div className="flex items-start justify-between gap-2 mb-5">
        <h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 pr-2">
          {objective.title}
        </h3>
        <ChevronRight
          size={16}
          className={`shrink-0 mt-0.5 transition-transform duration-200 text-gray-400 ${isSelected ? 'rotate-90' : ''}`}
        />
      </div>

      {/* Progress */}
      <div className="flex items-end justify-between mb-3">
        <span className={`text-3xl font-bold tracking-tight ${getProgressColor(objective.progressPct)}`}>
          {objective.progressPct}
          <span className="text-lg ml-0.5">%</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(objective.progressPct)}`}
          style={{ width: `${Math.min(objective.progressPct, 100)}%` }}
        />
      </div>

      {/* Status */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-auto overflow-hidden">
        <Calendar size={12} className="shrink-0" />
        <span className="truncate whitespace-nowrap">
          {objective.status === 'Chưa bắt đầu' ? 'Chưa bắt đầu' : objective.status}
        </span>
      </div>
    </button>
  );
}
