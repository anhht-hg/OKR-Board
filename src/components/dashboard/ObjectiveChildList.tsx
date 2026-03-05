'use client';

import { DashboardChild } from '@/types';
import { User } from 'lucide-react';

interface Props {
  children: DashboardChild[];
  onItemClick?: (id: string) => void;
}

const PROJECT_COLORS: Record<string, { bg: string; text: string }> = {
  'HG Stock': { bg: 'bg-red-100', text: 'text-red-700' },
  'QL Kênh': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'Tài chính': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'Quản lý NS': { bg: 'bg-purple-100', text: 'text-purple-700' },
  'Dữ liệu & Báo cáo': { bg: 'bg-amber-100', text: 'text-amber-700' },
};

const STATUS_DOT_COLORS: Record<string, string> = {
  'Hoàn thành': 'bg-emerald-500',
  'Đang triển khai': 'bg-orange-400',
  'Chưa bắt đầu': 'bg-gray-300',
};

function getProgressColor(pct: number) {
  if (pct >= 70) return 'text-emerald-600';
  if (pct >= 30) return 'text-orange-500';
  return 'text-rose-500';
}

function getProgressBarColor(pct: number) {
  if (pct >= 70) return 'bg-emerald-500';
  if (pct >= 30) return 'bg-orange-400';
  return 'bg-rose-400';
}

export function ObjectiveChildList({ children, onItemClick }: Props) {
  if (children.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-400">
        Không có mục con nào
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {children.map((child) => {
        const dotColor = STATUS_DOT_COLORS[child.status] || 'bg-gray-300';
        const projectColor = child.project
          ? PROJECT_COLORS[child.project] || { bg: 'bg-gray-100', text: 'text-gray-600' }
          : null;

        return (
          <button
            key={child.id}
            onClick={() => onItemClick?.(child.id)}
            className="w-full flex items-center gap-4 py-4 px-6 hover:bg-blue-50/50 transition-colors group text-left cursor-pointer"
          >
            {/* Status dot */}
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />

            {/* Icon/Type Placeholder (Optional, using dot for now as per reference) */}

            {/* Code & Title */}
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2">
                {child.code && (
                  <span className="text-[11px] font-bold text-gray-400 shrink-0 uppercase tracking-tight">
                    {child.code}
                  </span>
                )}
                <span className="text-sm text-gray-700 font-medium truncate group-hover:text-blue-700">
                  {child.title}
                </span>
              </div>
            </div>

            {/* Numeric Progress (Target/Value) */}
            <div className="shrink-0 w-24 text-right">
              {child.targetValue && (() => {
                const numTarget = parseFloat(child.targetValue);
                if (!isNaN(numTarget)) {
                  return (
                    <span className="text-[11px] font-semibold text-gray-400">
                      {Math.round(child.progressPct * numTarget / 100)}
                      <span className="mx-1">/</span>
                      {child.targetValue}
                    </span>
                  );
                }
                return null;
              })()}
            </div>

            {/* Progress bar & Percent */}
            <div className="flex items-center gap-3 shrink-0 w-32">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${getProgressBarColor(child.progressPct)}`}
                  style={{ width: `${Math.min(child.progressPct, 100)}%` }}
                />
              </div>
              <span className={`text-[13px] font-bold w-10 text-right tabular-nums ${getProgressColor(child.progressPct)}`}>
                {Math.round(child.progressPct)}%
              </span>
            </div>

            {/* Assignee avatar */}
            <div className="shrink-0">
              <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden shadow-sm">
                {child.owner ? (
                  <span className="text-[10px] font-bold text-blue-600 leading-none">
                    {child.owner.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()}
                  </span>
                ) : (
                  <User size={14} className="text-blue-500" />
                )}
              </div>
            </div>

            {/* Project badge */}
            <div className="shrink-0 w-28 flex justify-end">
              {projectColor && child.project && (
                <span
                  className={`text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider ${projectColor.bg} ${projectColor.text}`}
                >
                  {child.project}
                </span>
              )}
            </div>

            {/* Status label - One line */}
            <div className="shrink-0 w-28 text-right">
              <span className="text-[11px] font-semibold text-gray-400 whitespace-nowrap uppercase tracking-tighter">
                {child.status}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
