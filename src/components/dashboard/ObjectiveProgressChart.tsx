'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { DashboardStats } from '@/types';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

interface Props {
  stats: DashboardStats;
}

function getBarColor(pct: number) {
  if (pct >= 70) return '#10b981';
  if (pct >= 40) return '#3b82f6';
  return '#f97316';
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { title: string; progress: number; name: string } }[];
}) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    const color = getBarColor(d.progress);
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-xl px-4 py-3 text-xs max-w-[220px]">
        <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide mb-1">{d.name}</p>
        <p className="font-medium text-gray-700 leading-snug mb-2">{d.title}</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${d.progress}%`, background: color }} />
          </div>
          <span className="font-bold text-sm" style={{ color }}>{d.progress}%</span>
        </div>
      </div>
    );
  }
  return null;
};

export function ObjectiveProgressChart({ stats }: Props) {
  const data = stats.objectiveProgress.map((o) => ({
    name: o.code ? `OBJ ${o.code}` : o.title.substring(0, 8),
    progress: o.progressPct,
    title: o.title,
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full">
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-semibold text-gray-800">Tiến độ theo mục tiêu</h3>
            <InfoTooltip content={
              <div className="space-y-1.5">
                <p className="font-semibold text-white">Tiến độ theo mục tiêu</p>
                <p>Mỗi cột là một mục tiêu. Chiều cao cột = tiến độ được tính theo công thức:</p>
                <p className="bg-gray-800 rounded px-2 py-1 font-mono text-[10px]">50% × tb.(YTTC/KCTC) + 50% × tb.(tính năng)</p>
                <p>Màu sắc: <span className="text-emerald-400">xanh ≥70%</span> · <span className="text-blue-400">xanh dương 40-70%</span> · <span className="text-orange-400">cam &lt;40%</span></p>
              </div>
            } side="bottom" />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Mỗi mục tiêu đang ở đâu so với kế hoạch?</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-400" />≥70%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-400" />40–70%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-orange-400" />&lt;40%
          </span>
        </div>
      </div>
      <div className="mt-6">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              unit="%"
              axisLine={false}
              tickLine={false}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb', radius: 6 }} />
            <ReferenceLine y={70} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1} strokeOpacity={0.5} />
            <Bar dataKey="progress" radius={[6, 6, 0, 0]} maxBarSize={52}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.progress)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
