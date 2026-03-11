'use client';

import { DashboardStats } from '@/types';
import { ObjectiveCard } from './ObjectiveCard';

interface Props {
  stats: DashboardStats;
  selectedObjId: string | null;
  onSelect: (id: string | null) => void;
}

function getAvgProgressBarColor(pct: number) {
  if (pct >= 70) return 'bg-emerald-500';
  if (pct >= 40) return 'bg-blue-500';
  return 'bg-blue-600';
}

export function ObjectiveCardsPanel({ stats, selectedObjId, onSelect }: Props) {
  const avgPct = stats.avgObjectiveProgress;
  const objectives = stats.objectivesWithChildren;

  if (objectives.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-6">
      {/* Overall progress */}
      <div className="mb-4">
        <div className="flex items-end gap-3">
          <div className="text-5xl font-bold text-gray-900 tracking-tight">
            {avgPct}
            <span className="text-3xl">%</span>
          </div>
          <div className="mb-2 text-xs text-gray-400">
            trung bình {objectives.length} objectives
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">Tiến độ trung bình toàn bộ OKR</p>
      </div>

      {/* Overall progress bar */}
      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-6">
        <div
          className={`h-full rounded-full transition-all duration-700 ${getAvgProgressBarColor(avgPct)}`}
          style={{ width: `${Math.min(avgPct, 100)}%` }}
        />
      </div>

      {/* Filter hint */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-gray-400">Lọc theo mục tiêu:</span>
        <button
          onClick={() => onSelect(null)}
          className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all ${
            selectedObjId === null
              ? 'bg-gray-800 text-white border-gray-800'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
          }`}
        >
          Tất cả
        </button>
      </div>

      {/* Objective cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {objectives.map((obj, i) => (
          <ObjectiveCard
            key={obj.id}
            objective={obj}
            isSelected={selectedObjId === obj.id}
            onClick={() => onSelect(selectedObjId === obj.id ? null : obj.id)}
            colorIndex={i}
          />
        ))}
      </div>
    </div>
  );
}
