import { Header } from '@/components/layout/Header';
import { OkrModule } from '@/components/dashboard/OkrModule';
import { ProgressLogicExplainer } from '@/components/dashboard/ProgressLogicExplainer';
import prisma from '@/lib/prisma';

async function getData() {
  const objectivesWithChildren = await prisma.okrItem.findMany({
    where: { type: 'Objective' },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      code: true,
      title: true,
      progressPct: true,
      status: true,
      children: {
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          code: true,
          title: true,
          type: true,
          progressPct: true,
          project: true,
          status: true,
          owner: true,
          targetValue: true,
        },
      },
    },
  });

  const totalObjectives = objectivesWithChildren.length;
  const avgObjectiveProgress =
    totalObjectives > 0
      ? parseFloat(
          (
            objectivesWithChildren.reduce((s, o) => s + o.progressPct, 0) / totalObjectives
          ).toFixed(1)
        )
      : 0;

  return {
    totalObjectives,
    totalItems: 0,
    totalFeatures: 0,
    completedItems: 0,
    inProgressItems: 0,
    notStartedItems: 0,
    avgObjectiveProgress,
    objectiveProgress: [],
    objectivesWithChildren: objectivesWithChildren.map((o) => ({
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
    projectStats: [],
    statusBreakdown: [],
    roadmapItems: [],
    progressTrend: { series: [], points: [] },
    featureDelivery: {
      totalFeatures: 0, totalUC: 0,
      completedFeatures: 0, inProgressFeatures: 0, notStartedFeatures: 0,
      completedUC: 0, inProgressUC: 0,
      pctFeatures: 0, pctUC: 0, avgDeliveryPct: 0,
    },
    businessOutcomes: {
      totalSF: 0, totalKR: 0, totalOutcomes: 0, totalAdoption: 0, totalImpact: 0,
      completedSF: 0, completedKR: 0, completedOutcomes: 0, completedAdoption: 0, completedImpact: 0,
      pctSF: 0, pctKR: 0, pctOutcomes: 0, avgOutcomePct: 0, avgAdoptionPct: 0, avgImpactPct: 0,
    },
    deliveryByObjective: [],
    rawItems: [],
  };
}

export default async function OkrPage() {
  const data = await getData();
  return (
    <>
      <Header title="OKR Module" />
      <main className="pt-14 bg-[#f8f9fa] min-h-screen">
        <div className="max-w-[1600px] mx-auto px-8 py-10">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">OKR Module</h1>
            <p className="text-sm text-gray-500 mt-1">Công nghệ và vận hành · Theo dõi tiến độ Objectives</p>
          </div>
          <OkrModule stats={data} />
          <div className="mt-8">
            <ProgressLogicExplainer />
          </div>
        </div>
      </main>
    </>
  );
}

export const dynamic = 'force-dynamic';
