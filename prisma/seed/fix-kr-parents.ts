import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as path from 'path';

const projectRoot = path.resolve(__dirname, '../../..');
const dbUrl = process.env.DATABASE_URL || `file:${path.join(projectRoot, 'dev.db')}`;
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter } as any);

/**
 * Fix data structure: KRs that are direct children of Objective should be
 * children of the preceding SF (by sortOrder).
 *
 * Pattern in DB:
 *   Objective
 *     SuccessFactor (sortOrder=0)   ← SF 1
 *     KeyResult     (sortOrder=1)   ← belongs to SF 1
 *     KeyResult     (sortOrder=2)   ← belongs to SF 1
 *     SuccessFactor (sortOrder=3)   ← SF 2
 *     KeyResult     (sortOrder=4)   ← belongs to SF 2
 *     ...
 *
 * After fix:
 *   Objective
 *     SuccessFactor
 *       KeyResult
 *       KeyResult
 *     SuccessFactor
 *       KeyResult
 *       ...
 */
async function main() {
  const prismaAny = prisma as any;

  // Find all Objectives that have KR as direct children
  const objectivesWithBadKRs = await prismaAny.okrItem.findMany({
    where: { type: 'Objective' },
    include: {
      children: {
        orderBy: { sortOrder: 'asc' },
        select: { id: true, type: true, sortOrder: true, code: true, title: true },
      },
    },
  });

  let totalFixed = 0;

  for (const obj of objectivesWithBadKRs) {
    const children: any[] = obj.children;
    const hasOrphanKRs = children.some((c: any) => c.type === 'KeyResult');
    if (!hasOrphanKRs) continue;

    console.log(`\nFixing Objective ${obj.code} "${obj.title.substring(0, 50)}"`);

    let currentSF: any = null;
    let newSortOrder = 0;

    for (const child of children) {
      if (child.type === 'SuccessFactor') {
        currentSF = child;
        newSortOrder = 0;
        console.log(`  SF: ${child.code || '(no code)'} "${child.title?.substring(0, 40)}"`);
      } else if (child.type === 'KeyResult' && currentSF) {
        // Reparent this KR under the preceding SF
        await prismaAny.okrItem.update({
          where: { id: child.id },
          data: {
            parentId: currentSF.id,
            sortOrder: newSortOrder,
          },
        });
        newSortOrder++;
        totalFixed++;
        console.log(`    → moved KR "${child.title?.substring(0, 50)}" under SF ${currentSF.code || currentSF.id.substring(0, 8)}`);
      }
    }
  }

  console.log(`\n✅ Fixed ${totalFixed} KeyResults`);

  // Verify result
  console.log('\n=== Verification ===');
  const objs = await prismaAny.okrItem.findMany({
    where: { type: 'Objective' },
    include: {
      children: {
        orderBy: { sortOrder: 'asc' },
        include: {
          children: {
            orderBy: { sortOrder: 'asc' },
            select: { id: true, type: true, code: true, title: true },
          },
        },
        select: {
          id: true, type: true, code: true, title: true,
          children: true,
        },
      },
    },
  });

  for (const obj of objs) {
    console.log(`\nOBJ ${obj.code}`);
    for (const sf of obj.children) {
      console.log(`  [${sf.type}] ${sf.code || '-'} "${sf.title?.substring(0, 40)}"`);
      for (const kr of (sf.children || [])) {
        console.log(`    [${kr.type}] ${kr.code || '-'} "${kr.title?.substring(0, 40)}"`);
      }
    }
  }
}

main().catch(console.error).finally(() => (prisma as any).$disconnect());
