import { Header } from '@/components/layout/Header';
import { OkrDetailView } from '@/components/okr/OkrDetailView';
import prisma from '@/lib/prisma';

async function getData() {
  const objectives = await prisma.okrItem.findMany({
    where: { type: 'Objective' },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true, code: true, title: true, progressPct: true, status: true,
      owner: true, deadline: true, description: true, project: true,
      strategicPillar: true, pic: true, scope: true,
      children: {
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true, code: true, type: true, title: true, progressPct: true,
          status: true, owner: true, deadline: true, description: true,
          targetValue: true, notes: true, project: true, chotFlag: true,
          successMetric: true, measureFormula: true, corporateKRLinkage: true,
          children: {
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true, code: true, type: true, title: true, progressPct: true,
              status: true, owner: true, deadline: true, description: true,
              targetValue: true, notes: true, project: true, chotFlag: true,
              successMetric: true, measureFormula: true, corporateKRLinkage: true,
              children: {
                orderBy: { sortOrder: 'asc' },
                select: {
                  id: true, code: true, type: true, title: true, progressPct: true,
                  status: true, owner: true, deadline: true, targetValue: true,
                  notes: true, project: true, chotFlag: true,
                  children: {
                    orderBy: { sortOrder: 'asc' },
                    select: {
                      id: true, code: true, type: true, title: true,
                      progressPct: true, status: true, owner: true, targetValue: true,
                      chotFlag: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // Serialize dates and return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function serializeItem(item: Record<string, any>): Record<string, any> {
    return {
      ...item,
      deadline: item.deadline ?? null,
      children: item.children?.map(serializeItem) ?? [],
    };
  }

  return objectives.map(serializeItem);
}

export default async function OkrPage() {
  const objectives = await getData();
  return (
    <>
      <Header title="OKR Chi tiết" />
      <main className="pt-14 bg-[#f8f9fa] min-h-screen">
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">OKR 2026 — Chi tiết</h1>
            <p className="text-sm text-gray-500 mt-1">Ban Công nghệ & Vận hành · Mục tiêu, Kết quả và Tính năng triển khai</p>
          </div>
          <OkrDetailView objectives={objectives} />
        </div>
      </main>
    </>
  );
}

export const dynamic = 'force-dynamic';
