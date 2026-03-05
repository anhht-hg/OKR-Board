'use client';

import { FeatureDeliveryStats, BusinessOutcomesStats } from '@/types';
import { Package, TrendingUp, CheckCircle2, Clock, Circle } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

interface Props {
  featureDelivery: FeatureDeliveryStats;
  businessOutcomes: BusinessOutcomesStats;
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

function StatRow({
  label,
  sublabel,
  done,
  total,
  completedCount,
  pct,
  barColor,
}: {
  label: string;
  sublabel?: string;
  done: number;        // avg progress pct (for the bar)
  total: number;       // total items count
  completedCount: number; // how many have status=Hoàn thành
  pct: number;         // % completed by status
  barColor: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-start justify-between gap-2 text-xs">
        <div>
          <span className="text-gray-600 font-medium">{label}</span>
          {sublabel && <span className="text-gray-400 ml-1">({sublabel})</span>}
        </div>
        <div className="text-right shrink-0">
          <span className="text-gray-700 font-bold tabular-nums">{done}%</span>
          <span className="text-gray-400 font-normal ml-1.5 tabular-nums">
            {completedCount}/{total} hoàn thành
          </span>
        </div>
      </div>
      <MiniBar pct={done} color={barColor} />
    </div>
  );
}

function StatusPills({
  done,
  inProgress,
  notStarted,
  theme,
}: {
  done: number;
  inProgress: number;
  notStarted: number;
  theme: 'pink' | 'teal';
}) {
  const doneColor = theme === 'pink' ? 'bg-pink-100 text-pink-700' : 'bg-teal-100 text-teal-700';
  return (
    <div className="flex items-center gap-2 flex-wrap mt-1">
      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${doneColor}`}>
        <CheckCircle2 size={9} /> {done} hoàn thành
      </span>
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
        <Clock size={9} /> {inProgress} đang làm
      </span>
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
        <Circle size={9} /> {notStarted} chưa bắt đầu
      </span>
    </div>
  );
}

function ScoreBadge({ value, label }: { value: number; label: string }) {
  const color =
    value >= 70 ? 'text-emerald-600' : value >= 40 ? 'text-orange-500' : 'text-rose-500';
  return (
    <div className="text-right">
      <span className={`text-3xl font-bold ${color}`}>{value}</span>
      <span className="text-sm text-gray-400">%</span>
      <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

export function DualTrackPanel({ featureDelivery: fd, businessOutcomes: bo }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* ── Track 1: Feature Delivery ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center shrink-0">
            <Package size={18} className="text-pink-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-bold text-gray-900">Tiến Độ Triển Khai</h3>
              <InfoTooltip content={
                <div className="space-y-1.5">
                  <p className="font-semibold text-white">Tiến Độ Triển Khai</p>
                  <p>Đo lường việc <strong>xây dựng sản phẩm</strong> — chúng ta đã ship được bao nhiêu?</p>
                  <p><span className="text-pink-400">Tính năng %</span> = tb. tiến độ tất cả tính năng. Tính từ năng lực người dùng con.</p>
                  <p><span className="text-purple-400">NLND %</span> = tỷ lệ năng lực người dùng đã hoàn thành / tổng số.</p>
                  <p className="text-gray-400 text-[10px]">Mức độ tiếp nhận & tác động không ảnh hưởng đến con số này.</p>
                </div>
              } />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Chúng ta đang xây dựng được bao nhiêu?</p>
          </div>
          <ScoreBadge value={fd.avgDeliveryPct} label="tb. triển khai" />
        </div>

        <div className="space-y-3">
          <StatRow
            label="Tính năng"
            sublabel="tb. tiến độ"
            done={fd.avgDeliveryPct}
            total={fd.totalFeatures}
            completedCount={fd.completedFeatures}
            pct={fd.pctFeatures}
            barColor="bg-pink-400"
          />
          <StatRow
            label="Năng lực người dùng"
            sublabel="tb. tiến độ"
            done={fd.pctUC}
            total={fd.totalUC}
            completedCount={fd.completedUC}
            pct={fd.pctUC}
            barColor="bg-purple-400"
          />
        </div>

        <div className="mt-4 pt-4 border-t border-gray-50">
          <p className="text-[10px] text-gray-400 uppercase font-semibold mb-2">Trạng thái tính năng</p>
          <StatusPills
            done={fd.completedFeatures}
            inProgress={fd.inProgressFeatures}
            notStarted={fd.notStartedFeatures}
            theme="pink"
          />
        </div>
      </div>

      {/* ── Track 2: Business Outcomes ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
            <TrendingUp size={18} className="text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-bold text-gray-900">Kết Quả Đạt Được</h3>
              <InfoTooltip content={
                <div className="space-y-1.5">
                  <p className="font-semibold text-white">Kết Quả Đạt Được</p>
                  <p>Đo lường <strong>kết quả thực tế</strong> — người dùng có đón nhận không?</p>
                  <p><span className="text-teal-400">YTTC/KCTC %</span> = tỷ lệ hoàn thành theo trạng thái (cập nhật thủ công).</p>
                  <p><span className="text-green-400">Tiếp nhận %</span> = tb. tiến độ tất cả hạng mục tiếp nhận.</p>
                  <p><span className="text-rose-400">Tác động %</span> = tb. tiến độ tất cả hạng mục tác động.</p>
                  <p><strong>Số lớn góc phải ({bo.avgOutcomePct}%)</strong> = tb. tổng hợp tiếp nhận + tác động.</p>
                  
                </div>
              } />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Người dùng đã thực sự đón nhận chưa?</p>
          </div>
          <ScoreBadge value={bo.avgOutcomePct} label="tb. kết quả" />
        </div>

        <div className="space-y-3">
          {/* SF row */}
          <StatRow
            label="Yếu tố thành công"
            sublabel="hoàn thành"
            done={bo.pctSF}
            total={bo.totalSF}
            completedCount={bo.completedSF}
            pct={bo.pctSF}
            barColor="bg-teal-500"
          />
          <StatRow
            label="Kết quả then chốt"
            sublabel="hoàn thành"
            done={bo.pctKR}
            total={bo.totalKR}
            completedCount={bo.completedKR}
            pct={bo.pctKR}
            barColor="bg-slate-500"
          />

          {/* Divider with label */}
          <div className="flex items-center gap-2 pt-1">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Kết quả thực tế</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          {/* Adoption — show avg progress, not just % completed */}
          <StatRow
            label="Mức độ tiếp nhận"
            sublabel="tb. tiến độ"
            done={bo.avgAdoptionPct}
            total={bo.totalAdoption}
            completedCount={bo.completedAdoption}
            pct={bo.avgAdoptionPct}
            barColor="bg-green-500"
          />
          <StatRow
            label="Tác động"
            sublabel="tb. tiến độ"
            done={bo.avgImpactPct}
            total={bo.totalImpact}
            completedCount={bo.completedImpact}
            pct={bo.avgImpactPct}
            barColor="bg-rose-400"
          />
        </div>

        {/* Combined explanation */}
        <div className="mt-4 pt-4 border-t border-gray-50">
          <div className="flex items-center gap-1.5 mb-1.5">
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Tổng hợp</p>
            <InfoTooltip content={
              <div className="space-y-1.5">
                <p className="font-semibold text-white">Con số {bo.avgOutcomePct}% này là gì?</p>
                <p>= trung bình tiến độ của tất cả {bo.totalOutcomes} hạng mục tiếp nhận & tác động.</p>
                <p>Khác với tỷ lệ "hoàn thành" ({bo.completedOutcomes}/{bo.totalOutcomes} = {bo.pctOutcomes}%): hạng mục "Đang triển khai" vẫn đóng góp 50% vào con số này.</p>
              </div>
            } />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500">Tiếp nhận + Tác động</span>
                <span className="font-bold text-gray-700 tabular-nums">{bo.avgOutcomePct}% tb.</span>
              </div>
              <MiniBar pct={bo.avgOutcomePct} color="bg-emerald-500" />
            </div>
            <div className="text-[10px] text-gray-400 text-center shrink-0">
              <span className="block tabular-nums font-semibold text-gray-500">{bo.completedOutcomes}/{bo.totalOutcomes}</span>
              <span>hoàn thành</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
