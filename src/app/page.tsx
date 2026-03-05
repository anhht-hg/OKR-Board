import { Header } from '@/components/layout/Header';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { ObjectiveProgressChart } from '@/components/dashboard/ObjectiveProgressChart';
import { ProjectStatusChart } from '@/components/dashboard/ProjectStatusChart';
import { ProjectHealthGrid } from '@/components/dashboard/ProjectHealthGrid';
import { MonthlyTimeline } from '@/components/dashboard/MonthlyTimeline';
import { ProgressTrendChart } from '@/components/dashboard/ProgressTrendChart';
import prisma from '@/lib/prisma';

async function getDashboardData() {
  const allItems = await prisma.okrItem.findMany({
    select: { id: true, title: true, code: true, type: true, status: true, progressPct: true, project: true, owner: true, startDate: true, endDate: true },
  });

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
    objectivesWithChildren: [],
    projectStats,
    statusBreakdown: [
      { status: 'Hoàn thành', count: completedItems },
      { status: 'Đang triển khai', count: inProgressItems },
      { status: 'Chưa bắt đầu', count: notStartedItems },
    ],
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
        <div className="max-w-[1600px] mx-auto px-8 py-10 space-y-8">
          {/* Page title row */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tổng quan OKR 2026</h1>
            <p className="text-sm text-gray-500 mt-1">HG Entertainmen · Cập nhật thời gian thực</p>
          </div>

          {/* KPI Cards */}
          <DashboardStats stats={stats} />

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ObjectiveProgressChart stats={stats} />
            </div>
            <div>
              <ProjectStatusChart stats={stats} />
            </div>
          </div>

          {/* Progress trend */}
          <ProgressTrendChart stats={stats} />

          {/* Monthly timeline */}
          <MonthlyTimeline items={stats.roadmapItems} />

          {/* Project health */}
          <ProjectHealthGrid stats={stats} />
        </div>
      </main>
    </>
  );
}

export const dynamic = 'force-dynamic';
