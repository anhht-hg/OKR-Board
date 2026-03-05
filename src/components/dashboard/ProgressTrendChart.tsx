'use client';
import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { DashboardStats } from '@/types';

interface Props { stats: DashboardStats }

interface TooltipPayloadItem {
  dataKey: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  label?: string;
  payload?: TooltipPayloadItem[];
  series: Props['stats']['progressTrend']['series'];
  visible: Set<string>;
}

type Range = '7d' | '1m' | '1q' | 'all';

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: '7d',  label: '7 ngày'  },
  { value: '1m',  label: '1 tháng' },
  { value: '1q',  label: 'Quý'     },
  { value: 'all', label: 'Tất cả'  },
];

function CustomTooltip({ active, label, payload, series, visible }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const payloadMap = Object.fromEntries(payload.map(p => [p.dataKey, p.value]));
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-xs min-w-[160px]">
      <p className="font-semibold text-gray-600 mb-1.5">{label}</p>
      {series.filter(s => visible.has(s.id)).map(s => (
        <div key={s.id} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-gray-700 truncate max-w-[110px]">{s.code || s.title}</span>
          </div>
          <span className="font-semibold text-gray-800">{payloadMap[s.id] ?? 0}%</span>
        </div>
      ))}
    </div>
  );
}

export function ProgressTrendChart({ stats }: Props) {
  const { series, points } = stats.progressTrend;
  const [visible, setVisible] = useState<Set<string>>(() => new Set(series.map(s => s.id)));
  const [range, setRange] = useState<Range>('all');

  function toggle(id: string) {
    setVisible(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const filteredPoints = useMemo(() => {
    if (range === 'all') return points;
    const now = new Date();
    const cutoff = new Date(now);
    if (range === '7d') cutoff.setDate(now.getDate() - 7);
    else if (range === '1m') cutoff.setMonth(now.getMonth() - 1);
    else if (range === '1q') cutoff.setMonth(now.getMonth() - 3);
    return points.filter(p => new Date(p.date as string) >= cutoff);
  }, [points, range]);

  const tickInterval = Math.max(0, Math.floor(filteredPoints.length / 9) - 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-800">Xu hướng tiến độ</h3>
            <span className="text-[10px] bg-amber-100 text-amber-600 font-semibold px-1.5 py-0.5 rounded">
              Ước tính
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Objective nào đang tăng nhanh? Objective nào đang chậm lại?
          </p>
        </div>

        {/* Range filter */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all ${
                range === opt.value
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="mt-5">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={filteredPoints} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              interval={tickInterval}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              unit="%"
              axisLine={false}
              tickLine={false}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip
              content={<CustomTooltip series={series} visible={visible} />}
              cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
            />
            {series.map(s => (
              <Line
                key={s.id}
                dataKey={s.id}
                stroke={s.color}
                strokeWidth={visible.has(s.id) ? 2.5 : 0}
                dot={false}
                activeDot={visible.has(s.id) ? { r: 4, strokeWidth: 0 } : false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Objective toggles */}
      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
        {series.map(s => (
          <button
            key={s.id}
            onClick={() => toggle(s.id)}
            className={`flex items-center gap-2 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
              visible.has(s.id)
                ? 'border-transparent text-white'
                : 'border-gray-200 bg-white text-gray-400'
            }`}
            style={visible.has(s.id) ? { background: s.color } : {}}
          >
            <span className="font-bold">{s.code || s.title.substring(0, 6)}</span>
            <span className="opacity-80">{s.currentPct}%</span>
          </button>
        ))}
      </div>
    </div>
  );
}
