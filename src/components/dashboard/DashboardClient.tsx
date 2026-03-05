'use client';

import { useState, useMemo } from 'react';
import { DashboardStats, RawItem, FeatureDeliveryStats, BusinessOutcomesStats, ObjectiveTrackBreakdown } from '@/types';
import { DashboardStats as DashboardStatsComponent } from './DashboardStats';
import { ObjectiveProgressChart } from './ObjectiveProgressChart';
import { ProjectStatusChart } from './ProjectStatusChart';
import { ProjectHealthGrid } from './ProjectHealthGrid';
import { MonthlyTimeline } from './MonthlyTimeline';
import { ProgressTrendChart } from './ProgressTrendChart';
import { DualTrackPanel } from './DualTrackPanel';
import { ObjectiveTrackChart } from './ObjectiveTrackChart';
import { ProgressLogicExplainer } from './ProgressLogicExplainer';
import { Target, X } from 'lucide-react';

interface Props {
  stats: DashboardStats;
}

// ─── Utility: collect all descendant IDs of a given root (inclusive) ─────────
function collectDescendants(rootId: string, childMap: Map<string, RawItem[]>): Set<string> {
  const result = new Set<string>();
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    result.add(id);
    for (const child of childMap.get(id) ?? []) stack.push(child.id);
  }
  return result;
}

// ─── Recompute all stats from a filtered item list ────────────────────────────
function computeStats(items: RawItem[], base: DashboardStats, selectedObjId: string | null): DashboardStats {
  const childMap = new Map<string, RawItem[]>();
  for (const item of items) {
    if (item.parentId) {
      if (!childMap.has(item.parentId)) childMap.set(item.parentId, []);
      childMap.get(item.parentId)!.push(item);
    }
  }

  const byId = new Map(items.map(i => [i.id, i]));

  const avgPct = (ids: string[]) => {
    if (ids.length === 0) return 0;
    const vals = ids.map(id => byId.get(id)?.progressPct ?? 0);
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
  };

  const totalItems = items.length;
  const objectives = items.filter(i => i.type === 'Objective');
  const totalObjectives = objectives.length;
  const completedItems = items.filter(i => i.status === 'Hoàn thành').length;
  const inProgressItems = items.filter(i => i.status === 'Đang triển khai').length;
  const notStartedItems = items.filter(i => i.status === 'Chưa bắt đầu').length;
  const avgObjectiveProgress =
    totalObjectives > 0
      ? parseFloat((objectives.reduce((s, i) => s + i.progressPct, 0) / totalObjectives).toFixed(1))
      : 0;

  // Feature delivery
  const featureItems  = items.filter(i => i.type === 'Feature');
  const ucItems       = items.filter(i => i.type === 'UserCapability');
  const featureDelivery: FeatureDeliveryStats = {
    totalFeatures:      featureItems.length,
    totalUC:            ucItems.length,
    completedFeatures:  featureItems.filter(i => i.status === 'Hoàn thành').length,
    inProgressFeatures: featureItems.filter(i => i.status === 'Đang triển khai').length,
    notStartedFeatures: featureItems.filter(i => i.status === 'Chưa bắt đầu').length,
    completedUC:        ucItems.filter(i => i.status === 'Hoàn thành').length,
    inProgressUC:       ucItems.filter(i => i.status === 'Đang triển khai').length,
    pctFeatures:        featureItems.length > 0 ? Math.round(featureItems.filter(i => i.status === 'Hoàn thành').length / featureItems.length * 100) : 0,
    pctUC:              ucItems.length > 0 ? Math.round(ucItems.filter(i => i.status === 'Hoàn thành').length / ucItems.length * 100) : 0,
    avgDeliveryPct:     featureItems.length > 0 ? Math.round(featureItems.reduce((s, i) => s + i.progressPct, 0) / featureItems.length) : 0,
  };

  // Business outcomes
  const sfItems      = items.filter(i => i.type === 'SuccessFactor');
  const krItems      = items.filter(i => i.type === 'KeyResult');
  const adoptItems   = items.filter(i => i.type === 'Adoption');
  const impactItems  = items.filter(i => i.type === 'Impact');
  const outcomeItems = [...adoptItems, ...impactItems];
  const businessOutcomes: BusinessOutcomesStats = {
    totalSF:            sfItems.length,
    totalKR:            krItems.length,
    totalOutcomes:      outcomeItems.length,
    totalAdoption:      adoptItems.length,
    totalImpact:        impactItems.length,
    completedSF:        sfItems.filter(i => i.status === 'Hoàn thành').length,
    completedKR:        krItems.filter(i => i.status === 'Hoàn thành').length,
    completedOutcomes:  outcomeItems.filter(i => i.status === 'Hoàn thành').length,
    completedAdoption:  adoptItems.filter(i => i.status === 'Hoàn thành').length,
    completedImpact:    impactItems.filter(i => i.status === 'Hoàn thành').length,
    pctSF:              sfItems.length > 0 ? Math.round(sfItems.filter(i => i.status === 'Hoàn thành').length / sfItems.length * 100) : 0,
    pctKR:              krItems.length > 0 ? Math.round(krItems.filter(i => i.status === 'Hoàn thành').length / krItems.length * 100) : 0,
    pctOutcomes:        outcomeItems.length > 0 ? Math.round(outcomeItems.filter(i => i.status === 'Hoàn thành').length / outcomeItems.length * 100) : 0,
    avgOutcomePct:      outcomeItems.length > 0 ? Math.round(outcomeItems.reduce((s, i) => s + i.progressPct, 0) / outcomeItems.length) : 0,
    avgAdoptionPct:     adoptItems.length > 0 ? Math.round(adoptItems.reduce((s, i) => s + i.progressPct, 0) / adoptItems.length) : 0,
    avgImpactPct:       impactItems.length > 0 ? Math.round(impactItems.reduce((s, i) => s + i.progressPct, 0) / impactItems.length) : 0,
  };

  // Per-objective delivery vs outcome breakdown
  const deliveryByObjective: ObjectiveTrackBreakdown[] = objectives.map(obj => {
    const directChildren = childMap.get(obj.id) ?? [];
    const sfIds = directChildren.filter(c => c.type === 'SuccessFactor').map(c => c.id);
    const directKrIds = directChildren.filter(c => c.type === 'KeyResult').map(c => c.id);
    const sfKrIds = sfIds.flatMap(sfId => (childMap.get(sfId) ?? []).filter(c => c.type === 'KeyResult').map(c => c.id));
    const allKrIds = [...sfKrIds, ...directKrIds];
    const featIds = allKrIds.flatMap(krId => (childMap.get(krId) ?? []).filter(c => c.type === 'Feature').map(c => c.id));
    const outcomeIds = featIds.flatMap(fId => (childMap.get(fId) ?? []).filter(c => c.type === 'Adoption' || c.type === 'Impact').map(c => c.id));
    return {
      id: obj.id, code: obj.code, title: obj.title,
      progressPct: Math.round(obj.progressPct),
      deliveryPct: avgPct(featIds),
      outcomePct:  avgPct(outcomeIds),
    };
  });

  // Project stats
  const projects = [...new Set(items.map(i => i.project).filter(Boolean))] as string[];
  const projectStats = projects.map(project => {
    const pItems = items.filter(i => i.project === project);
    return {
      project,
      total: pItems.length,
      completed: pItems.filter(i => i.status === 'Hoàn thành').length,
      inProgress: pItems.filter(i => i.status === 'Đang triển khai').length,
      notStarted: pItems.filter(i => i.status === 'Chưa bắt đầu').length,
      progressPct: pItems.length > 0 ? Math.round(pItems.reduce((s, i) => s + i.progressPct, 0) / pItems.length) : 0,
    };
  });

  // Roadmap items
  const roadmapItems = items.map(i => ({
    id: i.id, title: i.title, code: i.code, type: i.type,
    project: i.project, status: i.status, owner: i.owner,
    startDate: i.startDate, endDate: i.endDate,
  }));

  // Progress trend (use same simulated growth logic, filtered objectives only)
  const TREND_COLORS = ['#3b82f6','#10b981','#f97316','#8b5cf6','#ec4899','#06b6d4'];
  const trendToday = new Date();
  const rangeStart = new Date('2026-01-01');
  const weeks: Date[] = [];
  const cur = new Date(rangeStart);
  while (cur <= trendToday) { weeks.push(new Date(cur)); cur.setDate(cur.getDate() + 7); }
  if (weeks.length === 0 || weeks[weeks.length - 1] < trendToday) weeks.push(new Date(trendToday));

  const trendSeries = objectives.map((o, i) => ({
    id: o.id, code: o.code, title: o.title,
    color: TREND_COLORS[i % TREND_COLORS.length],
    currentPct: Math.round(o.progressPct),
  }));
  const trendPoints = weeks.map(weekDate => {
    const point: Record<string, number | string> = {
      week: `${weekDate.getDate()}/${weekDate.getMonth() + 1}`,
      date: weekDate.toISOString(),
    };
    for (const o of objectives) {
      const objStart = o.startDate ? new Date(o.startDate) : rangeStart;
      const totalMs = trendToday.getTime() - objStart.getTime();
      const elapsedMs = weekDate.getTime() - objStart.getTime();
      if (elapsedMs <= 0 || totalMs <= 0) { point[o.id] = 0; }
      else {
        const t = Math.min(elapsedMs / totalMs, 1);
        point[o.id] = Math.round(Math.round(o.progressPct) * Math.pow(t, 1.4));
      }
    }
    return point;
  });

  return {
    ...base,
    totalItems,
    totalObjectives,
    completedItems,
    inProgressItems,
    notStartedItems,
    avgObjectiveProgress,
    objectiveProgress: objectives.map(o => ({
      id: o.id, code: o.code, title: o.title, progressPct: Math.round(o.progressPct),
    })),
    projectStats,
    statusBreakdown: [
      { status: 'Hoàn thành', count: completedItems },
      { status: 'Đang triển khai', count: inProgressItems },
      { status: 'Chưa bắt đầu', count: notStartedItems },
    ],
    featureDelivery,
    businessOutcomes,
    deliveryByObjective,
    roadmapItems,
    progressTrend: {
      series: trendSeries,
      points: trendPoints as Array<{ week: string; date: string; [key: string]: number | string }>,
    },
  };
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function DashboardClient({ stats }: Props) {
  const [selectedObjId, setSelectedObjId] = useState<string | null>(null);

  const objectives = stats.rawItems.filter(i => i.type === 'Objective');

  // Build childMap for descendant lookup
  const childMap = useMemo(() => {
    const map = new Map<string, RawItem[]>();
    for (const item of stats.rawItems) {
      if (item.parentId) {
        if (!map.has(item.parentId)) map.set(item.parentId, []);
        map.get(item.parentId)!.push(item);
      }
    }
    return map;
  }, [stats.rawItems]);

  // Filter items based on selected objective
  const filteredItems = useMemo(() => {
    if (!selectedObjId) return stats.rawItems;
    const ids = collectDescendants(selectedObjId, childMap);
    return stats.rawItems.filter(i => ids.has(i.id));
  }, [selectedObjId, stats.rawItems, childMap]);

  // Recompute stats from filtered items
  const filteredStats = useMemo(
    () => computeStats(filteredItems, stats, selectedObjId),
    [filteredItems, stats, selectedObjId]
  );

  const selectedObj = selectedObjId ? objectives.find(o => o.id === selectedObjId) : null;

  return (
    <div className="max-w-[1600px] mx-auto px-8 py-10 space-y-8">
      {/* Page title + filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Tổng quan OKR 2026</h1>
          <p className="text-sm text-gray-500 mt-1">HG Entertainment · Cập nhật thời gian thực</p>
        </div>

        {/* Objective filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 font-medium shrink-0 flex items-center gap-1">
            <Target size={13} /> Lọc theo mục tiêu:
          </span>
          <button
            onClick={() => setSelectedObjId(null)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              selectedObjId === null
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            Tất cả
          </button>
          {objectives.map(obj => (
            <button
              key={obj.id}
              onClick={() => setSelectedObjId(prev => prev === obj.id ? null : obj.id)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                selectedObjId === obj.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {obj.code ? obj.code : obj.title.substring(0, 10)}
            </button>
          ))}
        </div>
      </div>

      {/* Active filter banner */}
      {selectedObj && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <Target size={14} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide">Đang lọc theo mục tiêu</p>
            <p className="text-sm font-semibold text-blue-900 leading-snug">
              {selectedObj.code && <span className="text-blue-500 mr-1.5">{selectedObj.code}</span>}
              {selectedObj.title}
            </p>
          </div>
          <button
            onClick={() => setSelectedObjId(null)}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-700 transition-colors shrink-0"
          >
            <X size={14} /> Bỏ lọc
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <DashboardStatsComponent stats={filteredStats} />

      {/* Dual-track: Delivery vs Outcomes */}
      <DualTrackPanel featureDelivery={filteredStats.featureDelivery} businessOutcomes={filteredStats.businessOutcomes} />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ObjectiveProgressChart stats={filteredStats} />
        </div>
        <div>
          <ProjectStatusChart stats={filteredStats} />
        </div>
      </div>

      {/* Objective track breakdown */}
      <ObjectiveTrackChart data={filteredStats.deliveryByObjective} />

      {/* Progress trend */}
      <ProgressTrendChart stats={filteredStats} />

      {/* Monthly timeline */}
      <MonthlyTimeline items={filteredStats.roadmapItems} />

      {/* Project health */}
      <ProjectHealthGrid stats={filteredStats} />

      {/* Progress Calculation Logic */}
      <ProgressLogicExplainer />
    </div>
  );
}
