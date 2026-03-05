'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { DashboardStats } from '@/types';

const STATUS_CONFIG = [
  { key: 'Hoàn thành', color: '#10b981', label: 'Hoàn thành' },
  { key: 'Đang triển khai', color: '#f97316', label: 'Đang triển khai' },
  { key: 'Chưa bắt đầu', color: '#e5e7eb', label: 'Chưa bắt đầu' },
];

interface Props {
  stats: DashboardStats;
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { color: string } }[];
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-xl px-3 py-2 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: payload[0].payload.color }} />
          <p className="font-semibold text-gray-700">{payload[0].name}</p>
        </div>
        <p className="text-gray-900 font-bold text-sm">{payload[0].value} <span className="font-normal text-gray-400">hạng mục</span></p>
      </div>
    );
  }
  return null;
};

export function ProjectStatusChart({ stats }: Props) {
  const total = stats.statusBreakdown.reduce((sum, s) => sum + s.count, 0);

  const data = STATUS_CONFIG.map((cfg) => {
    const found = stats.statusBreakdown.find((s) => s.status === cfg.key);
    return { name: cfg.label, value: found?.count ?? 0, color: cfg.color };
  });

  const completedPct = total > 0 ? Math.round(((data[0]?.value ?? 0) / total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full flex flex-col">
      <div className="mb-1">
        <h3 className="text-base font-semibold text-gray-800">Phân bổ trạng thái</h3>
        <p className="text-xs text-gray-400 mt-0.5">Tỷ lệ hoàn thành toàn bộ hạng mục</p>
      </div>

      <div className="flex items-center gap-5 mt-6 flex-1">
        {/* Donut chart */}
        <div className="relative shrink-0" style={{ width: 130, height: 130 }}>
          <ResponsiveContainer width={130} height={130}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={60}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                strokeWidth={3}
                stroke="#fff"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-gray-900 leading-none">{completedPct}%</span>
            <span className="text-[10px] text-gray-400 mt-0.5">hoàn thành</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          {data.map((d) => {
            const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
            return (
              <div key={d.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-xs text-gray-600 font-medium">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-800">{d.value}</span>
                    <span className="text-[10px] text-gray-400">({pct}%)</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: d.color }}
                  />
                </div>
              </div>
            );
          })}
          <p className="text-[11px] text-gray-400 pt-1 border-t border-gray-100">Tổng: {total} hạng mục</p>
        </div>
      </div>
    </div>
  );
}
