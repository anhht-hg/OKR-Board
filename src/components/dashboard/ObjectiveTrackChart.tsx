'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { ObjectiveTrackBreakdown } from '@/types';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

interface Props {
  data: ObjectiveTrackBreakdown[];
}

const DELIVERY_COLOR = '#ec4899'; // pink-500
const OUTCOME_COLOR  = '#14b8a6'; // teal-500
const OVERALL_COLOR  = '#6366f1'; // indigo-500

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string; payload: ObjectiveTrackBreakdown & { label: string } }[];
}) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-xl px-4 py-3 text-xs max-w-[260px]">
      <p className="font-semibold text-gray-400 text-[10px] uppercase tracking-wide mb-0.5">{d.label}</p>
      <p className="font-medium text-gray-700 leading-snug mb-3 text-[11px]">{d.title}</p>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-gray-500">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ background: DELIVERY_COLOR }} />
            Triển khai
          </span>
          <span className="font-bold" style={{ color: DELIVERY_COLOR }}>{d.deliveryPct}%</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-gray-500">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ background: OUTCOME_COLOR }} />
            Kết quả
          </span>
          <span className="font-bold" style={{ color: OUTCOME_COLOR }}>{d.outcomePct}%</span>
        </div>
        <div className="border-t border-gray-100 pt-2 flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-gray-500">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ background: OVERALL_COLOR }} />
            Tổng thể
          </span>
          <span className="font-bold" style={{ color: OVERALL_COLOR }}>{d.progressPct}%</span>
        </div>
      </div>
    </div>
  );
};

const CustomLegend = () => (
  <div className="flex items-center gap-4 text-[11px] text-gray-400 mt-1">
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: DELIVERY_COLOR }} />
      Triển khai (tính năng + NLND)
    </span>
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: OUTCOME_COLOR }} />
      Kết quả (tiếp nhận + tác động)
    </span>
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: OVERALL_COLOR }} />
      Tổng thể
    </span>
  </div>
);

export function ObjectiveTrackChart({ data }: Props) {
  const chartData = data.map(o => ({
    ...o,
    label: o.code ? `OBJ ${o.code}` : o.title.substring(0, 6),
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="mb-1">
        <div className="flex items-center gap-1.5">
          <h3 className="text-base font-semibold text-gray-800">Triển Khai vs Kết Quả — Theo Mục Tiêu</h3>
          <InfoTooltip content={
            <div className="space-y-1.5">
              <p className="font-semibold text-white">3 cột cho mỗi mục tiêu</p>
              <p><span className="text-pink-400">■ Triển khai</span> = tb. tiến độ tất cả tính năng (tính từ năng lực người dùng con)</p>
              <p><span className="text-teal-400">■ Kết quả</span> = tb. tiến độ tất cả mức độ tiếp nhận & tác động</p>
              <p><span className="text-indigo-400">■ Tổng thể</span> = tiến độ đã lưu = 50% YTTC/KCTC + 50% tính năng</p>
              <p className="text-gray-400 text-[10px]">Lý tưởng: cả 3 cột đều cao và đều nhau.</p>
            </div>
          } side="bottom" />
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          So sánh tiến độ xây dựng (tính năng/NLND) với kết quả đạt được (tiếp nhận/tác động) cho mỗi mục tiêu
        </p>
      </div>
      <CustomLegend />
      <div className="mt-4">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -10 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="label"
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
            <ReferenceLine y={70} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1} strokeOpacity={0.4} />
            <Bar dataKey="deliveryPct" name="Triển khai" fill={DELIVERY_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="outcomePct"  name="Kết quả"    fill={OUTCOME_COLOR}  radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="progressPct" name="Tổng thể"   fill={OVERALL_COLOR}  radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
