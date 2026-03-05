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

async function recalculateAllProgress() {
  const typeOrder = ['UserCapability', 'Adoption', 'Impact', 'Feature', 'KeyResult', 'SuccessFactor', 'Objective'];

  for (const type of typeOrder) {
    const items = await prisma.okrItem.findMany({
      where: { type },
      include: { children: true },
    });

    for (const item of items) {
      let progress: number;
      if (item.children.length === 0) {
        progress = STATUS_WEIGHT[item.status] ?? 0;
      } else {
        const avg = item.children.reduce((s, c) => s + c.progressPct, 0) / item.children.length;
        progress = Math.round(avg);
      }
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
