import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const [allItems, objectives] = await Promise.all([
    prisma.okrItem.findMany({
      select: {
        type: true,
        status: true,
        progressPct: true,
        project: true,
      },
    }),
    prisma.okrItem.findMany({
      where: { type: 'Objective' },
      select: { id: true, code: true, title: true, progressPct: true },
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  const totalItems = allItems.length;
  const totalObjectives = allItems.filter((i) => i.type === 'Objective').length;
  const totalFeatures = allItems.filter((i) => i.type === 'Feature').length;
  const completedItems = allItems.filter((i) => i.status === 'Hoàn thành').length;
  const inProgressItems = allItems.filter((i) => i.status === 'Đang triển khai').length;
  const notStartedItems = allItems.filter((i) => i.status === 'Chưa bắt đầu').length;
  const avgProgress =
    totalItems > 0
      ? Math.round(allItems.reduce((s, i) => s + i.progressPct, 0) / totalItems)
      : 0;

  // Project stats
  const projects = [...new Set(allItems.map((i) => i.project).filter(Boolean))] as string[];
  const projectStats = projects.map((project) => {
    const items = allItems.filter((i) => i.project === project);
    const completed = items.filter((i) => i.status === 'Hoàn thành').length;
    const inProgress = items.filter((i) => i.status === 'Đang triển khai').length;
    const notStarted = items.filter((i) => i.status === 'Chưa bắt đầu').length;
    const pct = items.length > 0
      ? Math.round(items.reduce((s, i) => s + i.progressPct, 0) / items.length)
      : 0;
    return { project, total: items.length, completed, inProgress, notStarted, progressPct: pct };
  });

  const statusBreakdown = [
    { status: 'Hoàn thành', count: completedItems },
    { status: 'Đang triển khai', count: inProgressItems },
    { status: 'Chưa bắt đầu', count: notStartedItems },
  ];

  return NextResponse.json({
    totalItems,
    totalObjectives,
    totalFeatures,
    completedItems,
    inProgressItems,
    notStartedItems,
    avgProgress,
    objectiveProgress: objectives.map((o) => ({
      id: o.id,
      code: o.code,
      title: o.title,
      progressPct: Math.round(o.progressPct),
    })),
    projectStats,
    statusBreakdown,
  });
}
