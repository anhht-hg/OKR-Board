'use client';

import { DashboardStats } from '@/types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

interface Props {
  stats: DashboardStats;
}

function getHealth(pct: number) {
  if (pct >= 70) return {
    bar: 'bg-emerald-500',
    text: 'text-emerald-700',
    valueBg: 'bg-emerald-50',
    badge: 'bg-emerald-100 text-emerald-700',
    label: 'Tốt',
    Icon: TrendingUp,
  };
  if (pct >= 40) return {
    bar: 'bg-blue-500',
    text: 'text-blue-700',
    valueBg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
    label: 'Trung bình',
    Icon: Minus,
  };
  return {
    bar: 'bg-orange-400',
    text: 'text-orange-700',
    valueBg: 'bg-orange-50',
    badge: 'bg-orange-100 text-orange-700',
    label: 'Cần chú ý',
    Icon: TrendingDown,
  };
}

export function ProjectHealthGrid({ stats }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="mb-6">
        <div className="flex items-center gap-1.5">
          <h3 className="text-base font-semibold text-gray-800">Sức khỏe dự án</h3>
          <InfoTooltip content={
            <div className="space-y-1.5">
              <p className="font-semibold text-white">Sức khỏe dự án</p>
              <p>Tiến độ % = trung bình có trọng số của các Objective liên quan đến dự án.</p>
              <p className="text-gray-300 text-[11px]">Trọng số = số hạng mục <span className="text-white font-semibold">đã chốt</span> (Feature/UC/ADO/IMP) của Objective đó thuộc dự án này. Objective có nhiều việc chốt hơn sẽ ảnh hưởng nhiều hơn đến con số.</p>
              <p>Số đếm (Hoàn thành / Đang làm / Chưa bắt đầu) = các hạng mục thực thi (Feature, UC, ADO, IMP) được gán cho dự án.</p>
              <p>Nhãn sức khỏe: <span className="text-emerald-400">Tốt ≥70%</span> · <span className="text-blue-400">Trung bình 40–70%</span> · <span className="text-orange-400">Cần chú ý &lt;40%</span></p>
            </div>
          } />
        </div>
        <p className="text-xs text-gray-400 mt-0.5">Tiến độ và trạng thái từng dự án</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {stats.projectStats.map((p) => {
          const health = getHealth(p.progressPct);
          const { Icon } = health;
          return (
            <div
              key={p.project}
              className="rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow bg-gray-50/50"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-4">
                <span className="text-sm font-semibold text-gray-800 leading-snug">{p.project}</span>
                <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${health.badge}`}>
                  <Icon size={11} />
                  {health.label}
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-end justify-between mb-2">
                  <span className="text-xs text-gray-400 font-medium">Tiến độ tổng thể</span>
                  <span className={`text-2xl font-bold leading-none ${health.text}`}>{p.progressPct}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${health.bar}`}
                    style={{ width: `${Math.min(p.progressPct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white rounded-lg p-2.5 text-center border border-gray-100">
                  <p className="text-base font-bold text-emerald-600">{p.completed}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Hoàn thành</p>
                </div>
                <div className="bg-white rounded-lg p-2.5 text-center border border-gray-100">
                  <p className="text-base font-bold text-orange-500">{p.inProgress}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Đang làm</p>
                </div>
                <div className="bg-white rounded-lg p-2.5 text-center border border-gray-100">
                  <p className="text-base font-bold text-gray-400">{p.notStarted}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Chưa bắt đầu</p>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 mt-3 pt-3 border-t border-gray-100">
                {p.total} hạng mục trong dự án
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
