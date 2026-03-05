'use client';

import { DashboardStats as Stats } from '@/types';
import { Target, CheckCircle2, Clock, TrendingUp, Layers, Circle } from 'lucide-react';

interface Props {
  stats: Stats;
}

export function DashboardStats({ stats }: Props) {
  const completionRate =
    stats.totalItems > 0 ? Math.round((stats.completedItems / stats.totalItems) * 100) : 0;
  const inProgressRate =
    stats.totalItems > 0 ? Math.round((stats.inProgressItems / stats.totalItems) * 100) : 0;
  const notStartedRate =
    stats.totalItems > 0 ? Math.round((stats.notStartedItems / stats.totalItems) * 100) : 0;

  const cards = [
    {
      label: 'Tổng mục tiêu',
      value: stats.totalObjectives,
      sub: 'Objectives đang theo dõi',
      icon: Target,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      valueColor: 'text-blue-700',
      accentBorder: 'border-t-blue-500',
      bar: 'bg-blue-500',
      pct: 100,
    },
    {
      label: 'Tổng hạng mục',
      value: stats.totalItems,
      sub: 'Trên tất cả các loại',
      icon: Layers,
      iconColor: 'text-slate-600',
      iconBg: 'bg-slate-100',
      valueColor: 'text-slate-700',
      accentBorder: 'border-t-slate-400',
      bar: 'bg-slate-400',
      pct: 100,
    },
    {
      label: 'Hoàn thành',
      value: stats.completedItems,
      sub: `${completionRate}% tổng hạng mục`,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      valueColor: 'text-emerald-700',
      accentBorder: 'border-t-emerald-500',
      bar: 'bg-emerald-500',
      pct: completionRate,
    },
    {
      label: 'Đang triển khai',
      value: stats.inProgressItems,
      sub: `${inProgressRate}% đang thực hiện`,
      icon: Clock,
      iconColor: 'text-orange-500',
      iconBg: 'bg-orange-100',
      valueColor: 'text-orange-600',
      accentBorder: 'border-t-orange-400',
      bar: 'bg-orange-400',
      pct: inProgressRate,
    },
    {
      label: 'Chưa bắt đầu',
      value: stats.notStartedItems,
      sub: `${notStartedRate}% cần khởi động`,
      icon: Circle,
      iconColor: 'text-gray-400',
      iconBg: 'bg-gray-100',
      valueColor: 'text-gray-600',
      accentBorder: 'border-t-gray-300',
      bar: 'bg-gray-300',
      pct: notStartedRate,
    },
    {
      label: 'Tiến độ TB',
      value: `${stats.avgObjectiveProgress}%`,
      sub: 'Trung bình tất cả Objectives',
      icon: TrendingUp,
      iconColor: stats.avgObjectiveProgress >= 70 ? 'text-emerald-600' : stats.avgObjectiveProgress >= 40 ? 'text-blue-600' : 'text-rose-500',
      iconBg: stats.avgObjectiveProgress >= 70 ? 'bg-emerald-100' : stats.avgObjectiveProgress >= 40 ? 'bg-blue-100' : 'bg-rose-100',
      valueColor: stats.avgObjectiveProgress >= 70 ? 'text-emerald-700' : stats.avgObjectiveProgress >= 40 ? 'text-blue-700' : 'text-rose-600',
      accentBorder: stats.avgObjectiveProgress >= 70 ? 'border-t-emerald-500' : stats.avgObjectiveProgress >= 40 ? 'border-t-blue-500' : 'border-t-rose-400',
      bar: stats.avgObjectiveProgress >= 70 ? 'bg-emerald-500' : stats.avgObjectiveProgress >= 40 ? 'bg-blue-500' : 'bg-rose-400',
      pct: stats.avgObjectiveProgress,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`bg-white rounded-2xl border border-gray-100 border-t-4 ${card.accentBorder} shadow-sm hover:shadow-md transition-all duration-200 p-5`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                <Icon size={18} className={card.iconColor} />
              </div>
            </div>
            <p className={`text-3xl font-bold ${card.valueColor} leading-none mb-2`}>{card.value}</p>
            <p className="text-sm font-semibold text-gray-700 mb-0.5">{card.label}</p>
            <p className="text-xs text-gray-400 leading-snug">{card.sub}</p>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-4">
              <div
                className={`h-full rounded-full transition-all duration-500 ${card.bar}`}
                style={{ width: `${Math.min(card.pct, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
