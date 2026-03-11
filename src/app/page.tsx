import { Header } from '@/components/layout/Header';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import prisma from '@/lib/prisma';

async function getDashboardData() {
  const [allItems, objectivesRaw] = await Promise.all([
    prisma.okrItem.findMany({
      select: { id: true, title: true, code: true, type: true, status: true, progressPct: true, project: true, owner: true, startDate: true, endDate: true, parentId: true },
    }),
    prisma.okrItem.findMany({
      where: { type: 'Objective' },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true, code: true, title: true, progressPct: true, status: true,
        children: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, code: true, title: true, type: true, progressPct: true, project: true, status: true, owner: true, targetValue: true },
        },
      },
    }),
  ]);

  const totalItems = allItems.length;
  const objectives = allItems.filter((i) => i.type === 'Objective');
  const totalObjectives = objectives.length;
  const totalFeatures = allItems.filter((i) => i.type === 'Feature').length;
  const completedItems = allItems.filter((i) => i.status === 'Hoàn thành').length;
  const inProgressItems = allItems.filter((i) => i.status === 'Đang triển khai').length;
  const notStartedItems = allItems.filter((i) => i.status === 'Chưa bắt đầu').length;
  const avgObjectiveProgress =
    totalObjectives > 0
      ? parseFloat(
          (objectives.reduce((s, i) => s + i.progressPct, 0) / totalObjectives).toFixed(1)
        )
      : 0;

  const projects = [...new Set(allItems.map((i) => i.project).filter(Boolean))] as string[];
  const projectStats = projects.map((project) => {
    const items = allItems.filter((i) => i.project === project);
    const completed = items.filter((i) => i.status === 'Hoàn thành').length;
    const inProgress = items.filter((i) => i.status === 'Đang triển khai').length;
    const notStarted = items.filter((i) => i.status === 'Chưa bắt đầu').length;
    const pct =
      items.length > 0
        ? Math.round(items.reduce((s, i) => s + i.progressPct, 0) / items.length)
        : 0;
    return { project, total: items.length, completed, inProgress, notStarted, progressPct: pct };
  });

  // ── Dual-track stats ───────────────────────────────────────────────────────
  // Build parent→children map for in-memory hierarchy traversal
  const childMap = new Map<string, typeof allItems>();
  for (const item of allItems) {
    if (item.parentId) {
      if (!childMap.has(item.parentId)) childMap.set(item.parentId, []);
      childMap.get(item.parentId)!.push(item);
    }
  }
  const byId = new Map(allItems.map(i => [i.id, i]));

  const avgPct = (ids: string[]) => {
    if (ids.length === 0) return 0;
    const vals = ids.map(id => byId.get(id)?.progressPct ?? 0);
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
  };

  // Track 1: Feature Delivery — Feature + UserCapability
  const featureItems  = allItems.filter(i => i.type === 'Feature');
  const ucItems       = allItems.filter(i => i.type === 'UserCapability');
  const featureDelivery = {
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

  // Track 2: Business Outcomes — SuccessFactor + KeyResult + Adoption + Impact
  const sfItems      = allItems.filter(i => i.type === 'SuccessFactor');
  const krItems      = allItems.filter(i => i.type === 'KeyResult');
  const adoptItems   = allItems.filter(i => i.type === 'Adoption');
  const impactItems  = allItems.filter(i => i.type === 'Impact');
  const outcomeItems = [...adoptItems, ...impactItems];
  const businessOutcomes = {
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
  // Handle both regular (SF→KR→Feature) and irregular (direct KR→Feature) hierarchies
  const deliveryByObjective = objectives.map(obj => {
    const directChildren = childMap.get(obj.id) ?? [];
    const sfIds = directChildren.filter(c => c.type === 'SuccessFactor').map(c => c.id);
    const directKrIds = directChildren.filter(c => c.type === 'KeyResult').map(c => c.id);
    const sfKrIds = sfIds.flatMap(sfId => (childMap.get(sfId) ?? []).filter(c => c.type === 'KeyResult').map(c => c.id));
    const allKrIds = [...sfKrIds, ...directKrIds];
    const featIds = allKrIds.flatMap(krId => (childMap.get(krId) ?? []).filter(c => c.type === 'Feature').map(c => c.id));
    const outcomeIds = featIds.flatMap(fId => (childMap.get(fId) ?? []).filter(c => c.type === 'Adoption' || c.type === 'Impact').map(c => c.id));

    return {
      id: obj.id,
      code: obj.code,
      title: obj.title,
      progressPct: Math.round(obj.progressPct),
      deliveryPct: avgPct(featIds),
      outcomePct:  avgPct(outcomeIds),
    };
  });
  // ──────────────────────────────────────────────────────────────────────────

  return {
    totalItems,
    totalObjectives,
    totalFeatures,
    completedItems,
    inProgressItems,
    notStartedItems,
    avgObjectiveProgress,
    objectiveProgress: objectives.map((o) => ({
      id: o.id,
      code: o.code,
      title: o.title,
      progressPct: Math.round(o.progressPct),
    })),
    objectivesWithChildren: objectivesRaw.map((o) => ({
      id: o.id,
      code: o.code,
      title: o.title,
      progressPct: Math.round(o.progressPct),
      status: o.status,
      children: o.children.map((c) => ({
        id: c.id,
        code: c.code,
        title: c.title,
        type: c.type,
        progressPct: Math.round(c.progressPct),
        project: c.project,
        status: c.status,
        owner: c.owner,
        targetValue: c.targetValue,
      })),
    })),
    projectStats,
    featureDelivery,
    businessOutcomes,
    deliveryByObjective,
    statusBreakdown: [
      { status: 'Hoàn thành', count: completedItems },
      { status: 'Đang triển khai', count: inProgressItems },
      { status: 'Chưa bắt đầu', count: notStartedItems },
    ],
    rawItems: allItems.map((i) => ({
      id: i.id,
      title: i.title,
      code: i.code,
      type: i.type,
      status: i.status,
      progressPct: i.progressPct,
      project: i.project,
      owner: i.owner,
      startDate: i.startDate ? i.startDate.toISOString() : null,
      endDate: i.endDate ? i.endDate.toISOString() : null,
      parentId: i.parentId,
    })),
    roadmapItems: allItems.map((i) => ({
      id: i.id,
      title: i.title,
      code: i.code,
      type: i.type,
      project: i.project,
      status: i.status,
      owner: i.owner,
      startDate: i.startDate ? i.startDate.toISOString() : null,
      endDate: i.endDate ? i.endDate.toISOString() : null,
      parentId: i.parentId,
    })),
    progressTrend: (() => {
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

      const trendPoints = weeks.map((weekDate) => {
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

      return { series: trendSeries, points: trendPoints as Array<{ week: string; date: string; [key: string]: number | string }> };
    })(),
  };
}

export default async function DashboardPage() {
  const stats = await getDashboardData();

  return (
    <>
      <Header title="Dashboard" />
      <main className="pt-14 bg-[#f8f9fa] min-h-screen">
        <DashboardClient stats={stats} />
      </main>
    </>
  );
}

export const dynamic = 'force-dynamic';
