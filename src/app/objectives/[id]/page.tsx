import { Header } from '@/components/layout/Header';
import { ObjectiveNode } from '@/components/objectives/ObjectiveNode';
import prisma from '@/lib/prisma';

async function getObjective(id: string) {
  return prisma.okrItem.findUnique({
    where: { id },
    include: {
      children: {
        orderBy: { sortOrder: 'asc' },
        include: {
          children: {
            orderBy: { sortOrder: 'asc' },
            include: {
              children: {
                orderBy: { sortOrder: 'asc' },
                include: {
                  children: { orderBy: { sortOrder: 'asc' } },
                },
              },
            },
          },
        },
      },
    },
  });
}

export default async function ObjectiveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const objective = await getObjective(id);

  if (!objective) {
    return (
      <>
        <Header title="Không tìm thấy" />
        <main className="pt-14 p-6">
          <p className="text-gray-500">Không tìm thấy Objective với ID này.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title={`Chi tiết: ${objective.code || 'OBJ'}`} />
      <main className="pt-14 p-6">
        {(objective.strategicPillar ||
          objective.pic ||
          objective.scope ||
          objective.deadline) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-800 mb-3">
              Thông tin chiến lược (chỉ đọc)
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              {objective.strategicPillar && (
                <div>
                  <span className="text-blue-600 font-medium block text-xs uppercase tracking-wide mb-1">
                    Trụ cột chiến lược
                  </span>
                  <span className="text-blue-900">{objective.strategicPillar}</span>
                </div>
              )}
              {objective.pic && (
                <div>
                  <span className="text-blue-600 font-medium block text-xs uppercase tracking-wide mb-1">
                    PIC
                  </span>
                  <span className="text-blue-900">{objective.pic}</span>
                </div>
              )}
              {objective.deadline && (
                <div>
                  <span className="text-blue-600 font-medium block text-xs uppercase tracking-wide mb-1">
                    Thời hạn
                  </span>
                  <span className="text-blue-900">{objective.deadline}</span>
                </div>
              )}
              {objective.scope && (
                <div>
                  <span className="text-blue-600 font-medium block text-xs uppercase tracking-wide mb-1">
                    Phạm vi
                  </span>
                  <span className="text-blue-900">{objective.scope}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <ObjectiveNode objective={objective as any} />
      </main>
    </>
  );
}
