'use client';

import { useState } from 'react';
import { RoadmapItem } from '@/types';
import { TYPE_COLORS, TYPE_LABELS, PROJECTS } from '@/lib/constants';
import { isOverdue, startOfMonth, endOfMonth, formatMonthVi } from '@/lib/dateUtils';
import { ItemDetailDrawer } from './ItemDetailDrawer';
import { ChevronLeft, ChevronRight, Calendar, AlertCircle, CheckCircle2, Activity, Clock } from 'lucide-react';

interface Props {
  items: RoadmapItem[];
}

const TYPE_PILL_INACTIVE: Record<string, string> = {
  Objective:      'bg-blue-50 text-blue-500 border-blue-200 hover:bg-blue-100',
  SuccessFactor:  'bg-teal-50 text-teal-500 border-teal-200 hover:bg-teal-100',
  KeyResult:      'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200',
  Feature:        'bg-pink-50 text-pink-400 border-pink-200 hover:bg-pink-100',
  UserCapability: 'bg-purple-50 text-purple-400 border-purple-200 hover:bg-purple-100',
  Adoption:       'bg-green-50 text-green-600 border-green-200 hover:bg-green-100',
  Impact:         'bg-rose-50 text-rose-400 border-rose-200 hover:bg-rose-100',
};

const TYPE_BAR_STRIPE: Record<string, string> = {
  Objective:      'border-l-blue-600',
  SuccessFactor:  'border-l-teal-500',
  KeyResult:      'border-l-slate-700',
  Feature:        'border-l-pink-400',
  UserCapability: 'border-l-purple-500',
  Adoption:       'border-l-green-600',
  Impact:         'border-l-rose-400',
};

const TYPE_ABBREV: Record<string, string> = {
  Objective: 'OBJ',
  SuccessFactor: 'SF',
  KeyResult: 'KR',
  Feature: 'FT',
  UserCapability: 'UC',
  Adoption: 'ADO',
  Impact: 'IMP',
};

const ALL_TYPES = ['Objective', 'SuccessFactor', 'KeyResult', 'Feature', 'UserCapability', 'Adoption', 'Impact'];

function itemIntersectsMonth(item: RoadmapItem, monthStart: Date, monthEnd: Date): boolean {
  const start = item.startDate ? new Date(item.startDate) : null;
  const end = item.endDate ? new Date(item.endDate) : null;

  if (start && end) {
    return start <= monthEnd && end >= monthStart;
  }
  if (end && !start) {
    return end >= monthStart && end <= monthEnd;
  }
  if (start && !end) {
    return start >= monthStart && start <= monthEnd;
  }
  return false;
}

export function MonthlyTimeline({ items }: Props) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const mStart = startOfMonth(viewDate);
  const mEnd = endOfMonth(viewDate);
  const totalDays = mEnd.getDate();
  const isCurrentMonth = today.getFullYear() === viewDate.getFullYear() && today.getMonth() === viewDate.getMonth();

  function prevMonth() {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  }
  function nextMonth() {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  }

  function openDetail(id: string) {
    setDetailId(id);
    setDetailOpen(true);
  }

  function toggleType(t: string) {
    setSelectedTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }
  function toggleProject(p: string) {
    setSelectedProjects((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  }

  // Summary counts (all items, not filtered)
  const dueThisMonth = items.filter((i) => {
    if (!i.endDate) return false;
    const d = new Date(i.endDate);
    return d >= mStart && d <= mEnd;
  }).length;

  const activeThisMonth = items.filter((i) => {
    if (!i.startDate || !i.endDate) return false;
    const s = new Date(i.startDate);
    const e = new Date(i.endDate);
    return s <= today && e >= today && isCurrentMonth;
  }).length;

  const completedThisMonth = items.filter((i) => {
    if (i.status !== 'Hoàn thành' || !i.endDate) return false;
    const d = new Date(i.endDate);
    return d >= mStart && d <= mEnd;
  }).length;

  const overdueTotal = items.filter((i) => isOverdue(i.endDate, i.status)).length;

  // Filter items for Gantt
  const filtered = items.filter((i) => {
    if (selectedTypes.length > 0 && !selectedTypes.includes(i.type)) return false;
    if (selectedProjects.length > 0 && !selectedProjects.includes(i.project || '')) return false;
    return true;
  });

  const ganttItems = filtered.filter((i) => itemIntersectsMonth(i, mStart, mEnd));
  const undatedItems = filtered.filter((i) => !i.startDate && !i.endDate);

  // Day header marks (every 5 days)
  const dayMarks = [1, 5, 10, 15, 20, 25, 30].filter((d) => d <= totalDays);

  function barStyle(item: RoadmapItem): { left: string; width: string } | null {
    const start = item.startDate ? new Date(item.startDate) : null;
    const end = item.endDate ? new Date(item.endDate) : null;

    if (!start && !end) return null;

    let clampedStartDay: number;
    let clampedEndDay: number;

    if (start && end) {
      const cs = start < mStart ? mStart : start;
      const ce = end > mEnd ? mEnd : end;
      clampedStartDay = cs.getDate();
      clampedEndDay = ce.getDate();
    } else if (end) {
      // only endDate: 2% bar at that date
      const clampedEnd = end > mEnd ? mEnd : end;
      clampedEndDay = clampedEnd.getDate();
      clampedStartDay = clampedEndDay;
    } else {
      // only startDate: bar from that day to end of month
      const clampedStart = start! < mStart ? mStart : start!;
      clampedStartDay = clampedStart.getDate();
      clampedEndDay = totalDays;
    }

    const leftPct = ((clampedStartDay - 1) / totalDays) * 100;
    const rawWidth = ((clampedEndDay - clampedStartDay + 1) / totalDays) * 100;
    const widthPct = Math.max(2, rawWidth);

    return {
      left: `${leftPct.toFixed(2)}%`,
      width: `${widthPct.toFixed(2)}%`,
    };
  }

  function barColor(item: RoadmapItem): string {
    if (item.status === 'Hoàn thành') return 'bg-emerald-400';
    if (item.status === 'Đang triển khai') return 'bg-orange-400';
    return 'bg-gray-300';
  }

  const projects = PROJECTS.filter((p) => items.some((i) => i.project === p));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-5 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              Lịch triển khai
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 ml-6">Tiến độ từng hạng mục theo tháng</p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 py-5 border-b border-gray-100">
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={13} className="text-blue-500" />
            <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide">Đến hạn tháng này</span>
          </div>
          <span className="text-3xl font-bold text-blue-700">{dueThisMonth}</span>
        </div>
        <div className="bg-orange-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={13} className="text-orange-500" />
            <span className="text-[10px] font-semibold text-orange-500 uppercase tracking-wide">Đang hoạt động</span>
          </div>
          <span className="text-3xl font-bold text-orange-600">{activeThisMonth}</span>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={13} className="text-emerald-500" />
            <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">Hoàn thành</span>
          </div>
          <span className="text-3xl font-bold text-emerald-700">{completedThisMonth}</span>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={13} className="text-red-500" />
            <span className="text-[10px] font-semibold text-red-500 uppercase tracking-wide">Trễ hạn</span>
          </div>
          <span className="text-3xl font-bold text-red-600">{overdueTotal}</span>
        </div>
      </div>

      {/* Month nav + filters */}
      <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
        {/* Month nav */}
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-sm font-semibold text-gray-700 min-w-[140px] text-center">
            {formatMonthVi(viewDate)}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="h-5 w-px bg-gray-200" />

        {/* Type filter pills */}
        <div className="flex flex-wrap gap-1.5">
          {ALL_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold border transition-all ${
                selectedTypes.includes(t)
                  ? `${TYPE_COLORS[t]} border-transparent shadow-sm`
                  : TYPE_PILL_INACTIVE[t] || 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
              }`}
            >
              {TYPE_ABBREV[t]}
            </button>
          ))}
        </div>

        {projects.length > 0 && <div className="h-5 w-px bg-gray-200" />}

        {/* Project filter pills */}
        <div className="flex flex-wrap gap-1.5">
          {projects.map((p) => (
            <button
              key={p}
              onClick={() => toggleProject(p)}
              className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold border transition-all ${
                selectedProjects.includes(p)
                  ? 'bg-gray-800 text-white border-transparent shadow-sm'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Gantt area */}
      <div className="px-6 py-5">
        {ganttItems.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">Không có mục nào trong tháng này</p>
        ) : (
          <div className="overflow-x-auto">
            {/* Day header */}
            <div className="flex min-w-[640px] mb-2">
              <div className="w-56 flex-shrink-0" />
              <div className="flex-1 relative h-5">
                {dayMarks.map((d) => (
                  <span
                    key={d}
                    className="absolute text-[10px] text-gray-400 font-medium -translate-x-1/2"
                    style={{ left: `${((d - 1) / totalDays) * 100}%` }}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* Rows */}
            <div className="min-w-[640px] space-y-1">
              {ganttItems.map((item) => {
                const style = barStyle(item);
                const overdue = isOverdue(item.endDate, item.status);
                return (
                  <div key={item.id} className="flex items-center group">
                    {/* Left label */}
                    <div className="w-56 flex-shrink-0 flex items-center gap-2 pr-3">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold flex-shrink-0 ${TYPE_COLORS[item.type]}`}
                      >
                        {TYPE_ABBREV[item.type]}
                      </span>
                      <button
                        className="text-xs text-gray-600 hover:text-blue-600 truncate text-left transition-colors"
                        onClick={() => openDetail(item.id)}
                        title={item.title}
                      >
                        {item.code && <span className="text-gray-400 mr-1 font-medium">{item.code}</span>}
                        {item.title}
                      </button>
                    </div>

                    {/* Bar area */}
                    <div className="flex-1 h-7 relative bg-gray-50 rounded-lg overflow-hidden">
                      {/* Grid lines every 5 days */}
                      {dayMarks.map((d) => (
                        <div
                          key={d}
                          className="absolute top-0 bottom-0 w-px bg-gray-200/70"
                          style={{ left: `${((d - 1) / totalDays) * 100}%` }}
                        />
                      ))}

                      {/* Today line */}
                      {isCurrentMonth && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
                          style={{ left: `${((today.getDate() - 1) / totalDays) * 100}%` }}
                        />
                      )}

                      {/* Bar */}
                      {style && (
                        <button
                          className={`absolute top-1 bottom-1 rounded-md ${barColor(item)} border-l-[3px] ${TYPE_BAR_STRIPE[item.type] || 'border-l-gray-400'} ${
                            overdue ? 'ring-2 ring-red-500 ring-inset' : ''
                          } hover:brightness-105 hover:shadow-sm transition-all cursor-pointer`}
                          style={style}
                          onClick={() => openDetail(item.id)}
                          title={`${item.title}${overdue ? ' — Trễ hạn' : ''}`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No-date chips */}
        {undatedItems.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase font-semibold mb-2">Chưa có ngày</p>
            <div className="flex flex-wrap gap-1.5">
              {undatedItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openDetail(item.id)}
                  className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                  title={item.title}
                >
                  <span className={`text-[9px] px-1 rounded font-bold ${TYPE_COLORS[item.type]}`}>
                    {TYPE_ABBREV[item.type]}
                  </span>
                  <span className="max-w-[140px] truncate">{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <ItemDetailDrawer
        itemId={detailId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
