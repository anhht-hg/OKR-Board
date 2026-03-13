import prisma from './prisma';
import { STATUS_WEIGHT } from './constants';

/**
 * Core progress formula per the requirement document:
 *
 *   progress = (done_committed + done_bonus) / total_committed × 100
 *
 * Where:
 *   - committed = items with chotFlag != 'FALSE' (null/undefined/TRUE — default committed)
 *   - bonus     = items with chotFlag = 'FALSE'
 *   - done      = status = 'Hoàn thành' (weight 100), else partial by STATUS_WEIGHT
 *
 * This naturally produces:
 *   - <100%  when not all committed items are done
 *   - 100%   when all committed items are done, no bonus
 *   - >100%  when bonus items are also done
 *
 * If there are NO committed items at all, fall back to simple avg of all children.
 */
function calcChotProgress(
  children: { progressPct: number; chotFlag: string | null }[]
): number | null {
  if (children.length === 0) return null;

  const committed = children.filter(c => c.chotFlag !== 'FALSE');

  if (committed.length === 0) {
    // All bonus — treat as normal avg, no denominator inflation
    const total = children.reduce((s, c) => s + c.progressPct, 0);
    return Math.round(total / children.length);
  }

  // Numerator: sum of progress of ALL children (committed + bonus)
  const numerator = children.reduce((s, c) => s + c.progressPct, 0);
  // Denominator: total_committed × 100 (each committed is worth 100 when done)
  const denominator = committed.length * 100;

  return Math.round((numerator / denominator) * 100);
}

/**
 * Calculate the correct progressPct for an item based on its type and children.
 * Uses chotFlag-aware formula when children have chotFlag data.
 */
function calcItemProgress(
  item: { type: string; status: string },
  children: { type: string; progressPct: number; chotFlag: string | null }[],
  extraData?: {
    // For KeyResult: Adoption+Impact grandchildren via Feature children
    outcomeGrandchildren?: { progressPct: number; chotFlag: string | null }[];
    // For Objective: all Feature descendants (via KR or directly via SF)
    featureDescendants?: { progressPct: number; chotFlag: string | null }[];
  }
): number {
  // Leaf nodes — no children, use status weight directly
  if (children.length === 0) {
    return STATUS_WEIGHT[item.status] ?? 0;
  }

  if (item.type === 'Feature') {
    // Feature progress = chotFlag-aware progress of UC children
    const ucChildren = children.filter(c => c.type === 'UserCapability');
    if (ucChildren.length === 0) return STATUS_WEIGHT[item.status] ?? 0;
    return calcChotProgress(ucChildren) ?? STATUS_WEIGHT[item.status] ?? 0;
  }

  if (item.type === 'KeyResult') {
    // KR delivery = chotFlag-aware progress of Feature children
    const featureChildren = children.filter(c => c.type === 'Feature');
    const deliveryScore = featureChildren.length > 0
      ? (calcChotProgress(featureChildren) ?? 0)
      : 0;

    const outcomeItems = extraData?.outcomeGrandchildren ?? [];
    if (outcomeItems.length > 0) {
      const outcomeScore = calcChotProgress(outcomeItems) ?? 0;
      // 60% delivery + 40% outcomes
      return Math.round(deliveryScore * 0.6 + outcomeScore * 0.4);
    }
    return Math.round(deliveryScore);
  }

  if (item.type === 'Objective') {
    const strategicChildren = children.filter(
      c => c.type === 'SuccessFactor' || c.type === 'KeyResult'
    );
    // Strategic score: avg of SF/KR rollups (each already has chotFlag bonus baked in)
    const strategicScore = strategicChildren.length > 0
      ? strategicChildren.reduce((s, c) => s + c.progressPct, 0) / strategicChildren.length
      : STATUS_WEIGHT[item.status] ?? 0;

    const featureItems = extraData?.featureDescendants ?? [];
    if (featureItems.length > 0) {
      const featureScore = calcChotProgress(featureItems) ?? 0;
      return Math.round(strategicScore * 0.5 + featureScore * 0.5);
    }
    return Math.round(strategicScore);
  }

  // SuccessFactor:
  // - If children are KRs → avg them (KRs already carry bonus in their progressPct)
  // - If children are Features directly (no KR level) → apply chotFlag-aware formula
  const featureChildren = children.filter(c => c.type === 'Feature');
  if (featureChildren.length > 0) {
    return calcChotProgress(featureChildren) ?? Math.round(
      children.reduce((s, c) => s + c.progressPct, 0) / children.length
    );
  }
  return Math.round(
    children.reduce((s, c) => s + c.progressPct, 0) / children.length
  );
}

/**
 * Collect all Feature descendants of an Objective.
 * Covers both:
 *   Objective → KR → Feature  (via direct KR children)
 *   Objective → SF → KR → Feature  (via SF→KR)
 *   Objective → SF → Feature  (SF has Features directly, no KR level)
 */
async function collectFeatureDescendants(
  objChildren: { id: string; type: string }[]
): Promise<{ progressPct: number; chotFlag: string | null }[]> {
  const sfIds = objChildren.filter(c => c.type === 'SuccessFactor').map(c => c.id);
  const directKrIds = objChildren.filter(c => c.type === 'KeyResult').map(c => c.id);

  // SF children — could be KRs or Features
  const sfChildren = sfIds.length > 0
    ? await prisma.okrItem.findMany({
        where: { parentId: { in: sfIds } },
        select: { id: true, type: true, progressPct: true, chotFlag: true },
      })
    : [];

  // Features directly under SF
  const sfDirectFeatures = sfChildren.filter(c => c.type === 'Feature');
  // KRs under SF
  const sfKrIds = sfChildren.filter(c => c.type === 'KeyResult').map(c => c.id);

  // All KR ids: direct + via SF
  const allKrIds = [...sfKrIds, ...directKrIds];

  // Features under KRs
  const krFeatures = allKrIds.length > 0
    ? await prisma.okrItem.findMany({
        where: { parentId: { in: allKrIds }, type: 'Feature' },
        select: { progressPct: true, chotFlag: true },
      })
    : [];

  return [
    ...sfDirectFeatures.map(f => ({ progressPct: f.progressPct, chotFlag: f.chotFlag })),
    ...krFeatures,
  ];
}

/**
 * Fetch the extra data needed for KR and Objective progress calculations.
 */
async function fetchExtraData(
  item: { type: string; children: { id: string; type: string }[] }
): Promise<{
  outcomeGrandchildren?: { progressPct: number; chotFlag: string | null }[];
  featureDescendants?: { progressPct: number; chotFlag: string | null }[];
}> {
  if (item.type === 'KeyResult') {
    const featureIds = item.children.filter(c => c.type === 'Feature').map(c => c.id);
    if (featureIds.length > 0) {
      const outcomeGrandchildren = await prisma.okrItem.findMany({
        where: { parentId: { in: featureIds }, type: { in: ['Adoption', 'Impact'] } },
        select: { progressPct: true, chotFlag: true },
      });
      return { outcomeGrandchildren };
    }
  }
  if (item.type === 'Objective') {
    const featureDescendants = await collectFeatureDescendants(item.children);
    return { featureDescendants };
  }
  return {};
}

/**
 * Recalculate a single item's progressPct and save it, then walk up the ancestor chain.
 */
export async function recalcItem(itemId: string): Promise<void> {
  const item = await prisma.okrItem.findUnique({
    where: { id: itemId },
    include: { children: true },
  });
  if (!item) return;

  const extraData = await fetchExtraData(item);
  const progress = calcItemProgress(item, item.children, extraData);

  await prisma.okrItem.update({
    where: { id: item.id },
    data: { progressPct: progress },
  });

  await recalcAncestors(itemId);
}

/**
 * Walk up the parent chain recalculating each ancestor.
 */
export async function recalcAncestors(itemId: string): Promise<void> {
  let current = await prisma.okrItem.findUnique({ where: { id: itemId } });

  while (current?.parentId) {
    const parent = await prisma.okrItem.findUnique({
      where: { id: current.parentId },
      include: { children: true },
    });
    if (!parent) break;

    const extraData = await fetchExtraData(parent);
    const newPct = calcItemProgress(parent, parent.children, extraData);

    await prisma.okrItem.update({
      where: { id: parent.id },
      data: { progressPct: newPct },
    });

    current = parent;
  }
}

/**
 * Recalculate all items bottom-up in the correct order.
 */
export async function recalcAllFromScratch(): Promise<void> {
  const TYPE_ORDER = [
    'UserCapability', 'Adoption', 'Impact',
    'Feature', 'KeyResult', 'SuccessFactor', 'Objective',
  ];

  for (const type of TYPE_ORDER) {
    const items = await prisma.okrItem.findMany({
      where: { type },
      include: { children: true },
    });

    for (const item of items) {
      const extraData = await fetchExtraData(item);
      const pct = calcItemProgress(item, item.children, extraData);

      await prisma.okrItem.update({
        where: { id: item.id },
        data: { progressPct: pct },
      });
    }
  }
}
