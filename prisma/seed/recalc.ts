import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as path from 'path';

const projectRoot = path.resolve(__dirname, '../../..');
const dbUrl = process.env.DATABASE_URL || `file:${path.join(projectRoot, 'dev.db')}`;
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter } as any);

const STATUS_WEIGHT: Record<string, number> = {
  'Hoàn thành': 100,
  'Đang triển khai': 50,
  'Chưa bắt đầu': 0,
};

function calcChotProgress(children: { progressPct: number; chotFlag: string | null }[]): number | null {
  if (!children.length) return null;
  const committed = children.filter(c => c.chotFlag !== 'FALSE');
  if (!committed.length) return Math.round(children.reduce((s, c) => s + c.progressPct, 0) / children.length);
  const num = children.reduce((s, c) => s + c.progressPct, 0);
  return Math.round((num / (committed.length * 100)) * 100);
}

function calcItemProgress(
  item: { type: string; status: string },
  children: { type: string; progressPct: number; chotFlag: string | null }[],
  extra?: {
    outcomeGrandchildren?: { progressPct: number; chotFlag: string | null }[];
    featureDescendants?: { progressPct: number; chotFlag: string | null }[];
  }
): number {
  if (!children.length) return STATUS_WEIGHT[item.status] ?? 0;

  if (item.type === 'Feature') {
    const uc = children.filter(c => c.type === 'UserCapability');
    if (!uc.length) return STATUS_WEIGHT[item.status] ?? 0;
    return calcChotProgress(uc) ?? STATUS_WEIGHT[item.status] ?? 0;
  }

  if (item.type === 'KeyResult') {
    const feat = children.filter(c => c.type === 'Feature');
    const del = feat.length ? (calcChotProgress(feat) ?? 0) : 0;
    const out = extra?.outcomeGrandchildren ?? [];
    if (out.length) return Math.round(del * 0.6 + (calcChotProgress(out) ?? 0) * 0.4);
    return Math.round(del);
  }

  if (item.type === 'Objective') {
    const strat = children.filter(c => c.type === 'SuccessFactor' || c.type === 'KeyResult');
    const ss = strat.length
      ? strat.reduce((s, c) => s + c.progressPct, 0) / strat.length
      : STATUS_WEIGHT[item.status] ?? 0;
    const feats = extra?.featureDescendants ?? [];
    if (feats.length) return Math.round(ss * 0.5 + (calcChotProgress(feats) ?? 0) * 0.5);
    return Math.round(ss);
  }

  // SuccessFactor: Feature children direct → chotFlag-aware; KR children → avg
  const feat = children.filter(c => c.type === 'Feature');
  if (feat.length) return calcChotProgress(feat) ?? Math.round(children.reduce((s, c) => s + c.progressPct, 0) / children.length);
  return Math.round(children.reduce((s, c) => s + c.progressPct, 0) / children.length);
}

async function collectFeatureDescendants(
  objChildren: { id: string; type: string }[]
): Promise<{ progressPct: number; chotFlag: string | null }[]> {
  const sfIds = objChildren.filter(c => c.type === 'SuccessFactor').map(c => c.id);
  const directKrIds = objChildren.filter(c => c.type === 'KeyResult').map(c => c.id);
  const sfCh = sfIds.length
    ? await (prisma as any).okrItem.findMany({ where: { parentId: { in: sfIds } }, select: { id: true, type: true, progressPct: true, chotFlag: true } })
    : [];
  const sfFeats = sfCh.filter((c: any) => c.type === 'Feature');
  const sfKrIds = sfCh.filter((c: any) => c.type === 'KeyResult').map((c: any) => c.id);
  const allKr = [...sfKrIds, ...directKrIds];
  const krFeats = allKr.length
    ? await (prisma as any).okrItem.findMany({ where: { parentId: { in: allKr }, type: 'Feature' }, select: { progressPct: true, chotFlag: true } })
    : [];
  return [...sfFeats.map((f: any) => ({ progressPct: f.progressPct, chotFlag: f.chotFlag })), ...krFeats];
}

async function main() {
  console.log('Recalculating progress for all items...');
  const TYPES = ['UserCapability', 'Adoption', 'Impact', 'Feature', 'KeyResult', 'SuccessFactor', 'Objective'];

  for (const type of TYPES) {
    const items = await (prisma as any).okrItem.findMany({ where: { type }, include: { children: true } });
    for (const item of items) {
      let outcomeGrandchildren;
      let featureDescendants;

      if (type === 'KeyResult') {
        const fids = item.children.filter((c: any) => c.type === 'Feature').map((c: any) => c.id);
        if (fids.length) {
          outcomeGrandchildren = await (prisma as any).okrItem.findMany({
            where: { parentId: { in: fids }, type: { in: ['Adoption', 'Impact'] } },
            select: { progressPct: true, chotFlag: true },
          });
        }
      }
      if (type === 'Objective') {
        featureDescendants = await collectFeatureDescendants(item.children);
      }

      const pct = calcItemProgress(item, item.children, { outcomeGrandchildren, featureDescendants });
      await (prisma as any).okrItem.update({ where: { id: item.id }, data: { progressPct: pct } });
    }
    console.log(`  ${type}: done (${items.length} items)`);
  }

  // Print Objective 03 result
  const obj03 = await (prisma as any).okrItem.findUnique({
    where: { id: 'seed_objective_118' },
    include: { children: { include: { children: true } } },
  });
  console.log('\n=== Objective 03 result ===');
  console.log(`Objective: ${obj03.progressPct}%`);
  for (const sf of obj03.children) {
    console.log(`  SF: ${sf.progressPct}% | chotFlag=${sf.chotFlag}`);
    for (const f of sf.children) {
      console.log(`    Feature: ${f.progressPct}% | chotFlag=${f.chotFlag}`);
    }
  }
}

main().catch(console.error).finally(() => (prisma as any).$disconnect());
