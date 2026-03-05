import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { parseFile1 } from './parse-file1';
import * as path from 'path';

// Resolve DB path relative to project root (where package.json lives)
const projectRoot = path.resolve(__dirname, '../../..');
const dbUrl = process.env.DATABASE_URL || `file:${path.join(projectRoot, 'dev.db')}`;
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter } as any);

const STATUS_WEIGHT: Record<string, number> = {
  'Hoàn thành': 100,
  'Đang triển khai': 50,
  'Chưa bắt đầu': 0,
};

function calcProgress(
  item: { type: string; status: string },
  children: { type: string; progressPct: number }[],
  outcomeGrandchildren?: { progressPct: number }[],
  featureDescendants?: { progressPct: number }[]
): number {
  const avg = (arr: { progressPct: number }[]) =>
    arr.length > 0 ? arr.reduce((s, c) => s + c.progressPct, 0) / arr.length : 0;

  if (children.length === 0) return STATUS_WEIGHT[item.status] ?? 0;

  if (item.type === 'Feature') {
    const uc = children.filter(c => c.type === 'UserCapability');
    return uc.length > 0 ? Math.round(avg(uc)) : STATUS_WEIGHT[item.status] ?? 0;
  }

  if (item.type === 'KeyResult') {
    const features = children.filter(c => c.type === 'Feature');
    const deliveryScore = avg(features);
    if (outcomeGrandchildren && outcomeGrandchildren.length > 0) {
      return Math.round(deliveryScore * 0.6 + avg(outcomeGrandchildren) * 0.4);
    }
    return Math.round(deliveryScore);
  }

  if (item.type === 'Objective') {
    // Treat both SF and direct KR children as strategic signals
    const strategic = children.filter(c => c.type === 'SuccessFactor' || c.type === 'KeyResult');
    const strategicScore = strategic.length > 0 ? avg(strategic) : STATUS_WEIGHT[item.status] ?? 0;
    if (featureDescendants && featureDescendants.length > 0) {
      return Math.round(strategicScore * 0.5 + avg(featureDescendants) * 0.5);
    }
    return Math.round(strategicScore);
  }

  return Math.round(avg(children));
}

async function recalculateAllProgress() {
  const typeOrder = ['UserCapability', 'Adoption', 'Impact', 'Feature', 'KeyResult', 'SuccessFactor', 'Objective'];

  for (const type of typeOrder) {
    const items = await prisma.okrItem.findMany({
      where: { type },
      include: { children: true },
    });

    for (const item of items) {
      let outcomeGrandchildren: { progressPct: number }[] | undefined;
      let featureDescendants: { progressPct: number }[] | undefined;

      if (type === 'KeyResult') {
        const featureIds = item.children.filter(c => c.type === 'Feature').map(c => c.id);
        if (featureIds.length > 0) {
          outcomeGrandchildren = await prisma.okrItem.findMany({
            where: { parentId: { in: featureIds }, type: { in: ['Adoption', 'Impact'] } },
            select: { progressPct: true },
          });
        }
      }

      if (type === 'Objective') {
        const sfIds = item.children.filter(c => c.type === 'SuccessFactor').map(c => c.id);
        const directKrIds = item.children.filter(c => c.type === 'KeyResult').map(c => c.id);
        const sfKrItems = sfIds.length > 0
          ? await prisma.okrItem.findMany({
              where: { parentId: { in: sfIds }, type: 'KeyResult' },
              select: { id: true },
            })
          : [];
        const allKrIds = [...sfKrItems.map(k => k.id), ...directKrIds];
        if (allKrIds.length > 0) {
          featureDescendants = await prisma.okrItem.findMany({
            where: { parentId: { in: allKrIds }, type: 'Feature' },
            select: { progressPct: true },
          });
        }
      }

      const progress = calcProgress(item, item.children, outcomeGrandchildren, featureDescendants);
      await prisma.okrItem.update({
        where: { id: item.id },
        data: { progressPct: progress },
      });
    }
  }
}

async function main() {
  console.log('🗑️  Deleting all existing data...');
  await prisma.okrItem.deleteMany({});
  console.log('✅ All data deleted');

  console.log('🌱 Parsing HTML...');
  const items = parseFile1();
  console.log(`📄 Parsed: ${items.length} items`);

  // Build hierarchy from flat list using indent levels
  // indentLevel: 0=Objective, 1=SuccessFactor/KeyResult, 2=Feature, 3=UC/Adoption/Impact
  const parentStack: (string | null)[] = [null, null, null, null];

  for (const item of items) {
    const parentLevel = item.indentLevel - 1;
    const parentId = parentLevel >= 0 ? parentStack[parentLevel] : null;

    const safeId = `seed_${item.type}_${item.sortOrder}`.toLowerCase().replace(/[\s\/]/g, '_');

    const dbItem = await prisma.okrItem.create({
      data: {
        id: safeId,
        code: item.code,
        title: item.title,
        type: item.type,
        sortOrder: item.sortOrder,
        project: item.project,
        status: item.status,
        startDate: item.startDate,
        endDate: item.endDate,
        owner: item.owner,
        stakeholder: item.stakeholder,
        chotFlag: item.chotFlag,
        isOptional: item.isOptional,
        parentId,
      },
    });

    parentStack[item.indentLevel] = dbItem.id;
    for (let l = item.indentLevel + 1; l < parentStack.length; l++) {
      parentStack[l] = null;
    }
  }

  console.log(`✅ Inserted ${items.length} items`);

  await recalculateAllProgress();
  console.log('✅ Progress recalculated');

  const counts = await prisma.okrItem.groupBy({
    by: ['type'],
    _count: true,
  });
  console.log('\n📊 Summary:');
  counts.forEach(c => console.log(`  ${c.type}: ${c._count}`));
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
