'use client';

import { useState } from 'react';
import { RoadmapItem } from '@/types';

interface Props {
  items: RoadmapItem[];
}

const QUARTERS = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'];
const QUARTER_MONTHS: Record<string, string[]> = {
  'Q1 2026': ['1', '2', '3'],
  'Q2 2026': ['4', '5', '6'],
  'Q3 2026': ['7', '8', '9'],
  'Q4 2026': ['10', '11', '12'],
};

const STATUS_COLOR: Record<string, string> = {
  'Hoàn thành': 'bg-emerald-400',
  'Đang triển khai': 'bg-orange-400',
  'Chưa bắt đầu': 'bg-gray-200',
};

const TYPE_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'Feature', label: 'Feature' },
  { value: 'UserCapability', label: 'User Capability' },
  { value: 'KeyResult', label: 'Key Result' },
  { value: 'SuccessFactor', label: 'Success Factor' },
  { value: 'Adoption', label: 'Adoption' },
  { value: 'Impact', label: 'Impact' },
];

function getQuarter(item: RoadmapItem): string {
  // Use endDate if present
  if (item.endDate) {
    const d = new Date(item.endDate);
    const m = d.getMonth() + 1;
    if (m <= 3) return 'Q1 2026';
    if (m <= 6) return 'Q2 2026';
    if (m <= 9) return 'Q3 2026';
    return 'Q4 2026';
  }
  // Use startDate if present
  if (item.startDate) {
    const d = new Date(item.startDate);
    const m = d.getMonth() + 1;
    if (m <= 3) return 'Q1 2026';
    if (m <= 6) return 'Q2 2026';
    if (m <= 9) return 'Q3 2026';
    return 'Q4 2026';
  }
  // Derive from status when no dates
  if (item.status === 'Hoàn thành') return Math.random() < 0.5 ? 'Q1 2026' : 'Q2 2026';
  if (item.status === 'Đang triển khai') return Math.random() < 0.5 ? 'Q2 2026' : 'Q3 2026';
  return Math.random() < 0.5 ? 'Q3 2026' : 'Q4 2026';
}

type QuarterCount = Record<string, { done: number; wip: number; todo: number; total: number }>;

export function RoadmapTimeline({ items }: Props) {
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = typeFilter === 'all' ? items : items.filter((i) => i.type === typeFilter);

  // Build per-project, per-quarter counts (deterministic using index-based assignment)
  const projects = [...new Set(filtered.map((i) => i.project).filter(Boolean))] as string[];

  // Stable quarter assignment by item index to avoid random re-render shifts
  const quarterMap: Record<string, string> = {};
  filtered.forEach((item, idx) => {
    if (item.endDate || item.startDate) {
      quarterMap[item.id] = getQuarter(item);
    } else if (item.status === 'Hoàn thành') {
      quarterMap[item.id] = idx % 2 === 0 ? 'Q1 2026' : 'Q2 2026';
    } else if (item.status === 'Đang triển khai') {
      quarterMap[item.id] = idx % 2 === 0 ? 'Q2 2026' : 'Q3 2026';
    } else {
      quarterMap[item.id] = idx % 2 === 0 ? 'Q3 2026' : 'Q4 2026';
    }
  });

  const projectData: Record<string, QuarterCount> = {};
  for (const proj of projects) {
    projectData[proj] = {};
    for (const q of QUARTERS) {
      projectData[proj][q] = { done: 0, wip: 0, todo: 0, total: 0 };
    }
  }

  for (const item of filtered) {
    if (!item.project) continue;
    const q = quarterMap[item.id];
    if (!projectData[item.project] || !projectData[item.project][q]) continue;
    projectData[item.project][q].total += 1;
    if (item.status === 'Hoàn thành') projectData[item.project][q].done += 1;
    else if (item.status === 'Đang triển khai') projectData[item.project][q].wip += 1;
    else projectData[item.project][q].todo += 1;
  }

  // Max total in any cell for scaling bars
  const maxTotal = Math.max(
    1,
    ...projects.flatMap((p) => QUARTERS.map((q) => projectData[p][q].total))
  );

  const hasNoDates = filtered.every((i) => !i.startDate && !i.endDate);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Roadmap Timeline 2026</h3>
          {hasNoDates && (
            <p className="text-[10px] text-amber-600 mt-0.5">
              Phân bổ theo trạng thái — thêm ngày bắt đầu/kết thúc trong chi tiết hạng mục để xem chính xác hơn.
            </p>
          )}
        </div>

        {/* Type filter */}
        <div className="flex flex-wrap gap-1">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTypeFilter(opt.value)}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-full border transition-colors ${
                typeFilter === opt.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        {[
          { label: 'Hoàn thành', color: 'bg-emerald-400' },
          { label: 'Đang triển khai', color: 'bg-orange-400' },
          { label: 'Chưa bắt đầu', color: 'bg-gray-200' },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
            <span className="text-[10px] text-gray-500">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      {projects.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-sm text-gray-400">
          Không có dữ liệu cho bộ lọc này
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left py-1.5 pr-4 text-[11px] font-medium text-gray-500 w-36 min-w-[9rem]">
                  Dự án
                </th>
                {QUARTERS.map((q) => (
                  <th key={q} className="text-center py-1.5 px-2 text-[11px] font-medium text-gray-500 min-w-[80px]">
                    {q}
                  </th>
                ))}
                <th className="text-right py-1.5 pl-4 text-[11px] font-medium text-gray-500 w-14">
                  Tổng
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {projects.map((proj) => {
                const projTotal = QUARTERS.reduce((s, q) => s + projectData[proj][q].total, 0);
                return (
                  <tr key={proj} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4 font-medium text-gray-700 text-[11px] truncate max-w-[9rem]">
                      {proj}
                    </td>
                    {QUARTERS.map((q) => {
                      const cell = projectData[proj][q];
                      const barWidth = cell.total > 0 ? Math.round((cell.total / maxTotal) * 100) : 0;
                      return (
                        <td key={q} className="px-2 py-3">
                          {cell.total > 0 ? (
                            <div className="flex flex-col gap-1">
                              {/* Stacked bar */}
                              <div className="w-full h-4 bg-gray-100 rounded overflow-hidden flex">
                                {cell.done > 0 && (
                                  <div
                                    className="h-full bg-emerald-400"
                                    style={{ width: `${(cell.done / cell.total) * barWidth}%` }}
                                  />
                                )}
                                {cell.wip > 0 && (
                                  <div
                                    className="h-full bg-orange-400"
                                    style={{ width: `${(cell.wip / cell.total) * barWidth}%` }}
                                  />
                                )}
                                {cell.todo > 0 && (
                                  <div
                                    className="h-full bg-gray-300"
                                    style={{ width: `${(cell.todo / cell.total) * barWidth}%` }}
                                  />
                                )}
                              </div>
                              <div className="text-center text-[10px] text-gray-500">
                                {cell.total}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-gray-200 text-[10px]">—</div>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-3 pl-4 text-right">
                      <span className="text-[11px] font-semibold text-gray-700">{projTotal}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
