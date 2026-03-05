import prisma from './prisma';
import { STATUS_WEIGHT } from './constants';

function avg(items: { progressPct: number }[]): number {
  if (items.length === 0) return 0;
  return items.reduce((s, c) => s + c.progressPct, 0) / items.length;
}

/**
 * Calculate the correct progressPct for an item based on its type and children.
 *
 * Rules:
 *  - UserCapability / Adoption / Impact (leaves): STATUS_WEIGHT[status]
 *  - Feature:   avg of UserCapability children only (Adoption & Impact excluded)
 *  - KeyResult: 60% avg(Feature children) + 40% avg(Adoption+Impact grandchildren via Feature)
 *  - SuccessFactor: avg of KeyResult children
 *  - Objective: 50% avg(SuccessFactor children) + 50% avg(all Feature descendants)
 *
 * @param item      The item being calculated (needs .type and .status)
 * @param children  Direct children already loaded (with their progressPct values)
 * @param extraData Optional additional data needed for cross-level lookups
 */
function calcItemProgress(
  item: { type: string; status: string },
  children: { type: string; progressPct: number }[],
  extraData?: {
    // For KeyResult: Adoption+Impact items that are grandchildren (Feature's children)
    outcomeGrandchildren?: { progressPct: number }[];
    // For Objective: all Feature descendants
    featureDescendants?: { progressPct: number }[];
  }
): number {
  // Leaf nodes — no children, use status weight
  if (children.length === 0) {
    return STATUS_WEIGHT[item.status] ?? 0;
  }

  if (item.type === 'Feature') {
    // Only UserCapability children drive Feature progress
    const ucChildren = children.filter(c => c.type === 'UserCapability');
    return ucChildren.length > 0
      ? Math.round(avg(ucChildren))
      : STATUS_WEIGHT[item.status] ?? 0;
  }

  if (item.type === 'KeyResult') {
    const featureChildren = children.filter(c => c.type === 'Feature');
    const deliveryScore = featureChildren.length > 0 ? avg(featureChildren) : 0;

    const outcomeItems = extraData?.outcomeGrandchildren ?? [];
    if (outcomeItems.length > 0) {
      // 60% delivery (Feature/UC) + 40% outcomes (Adoption+Impact)
      return Math.round(deliveryScore * 0.6 + avg(outcomeItems) * 0.4);
    }
    return Math.round(deliveryScore);
  }

  if (item.type === 'Objective') {
    // "Strategic score" = avg of direct SF children + direct KR children
    // (some objectives have irregular hierarchies with KR directly under them)
    const strategicChildren = children.filter(
      c => c.type === 'SuccessFactor' || c.type === 'KeyResult'
    );
    const strategicScore =
      strategicChildren.length > 0
        ? avg(strategicChildren)
        : STATUS_WEIGHT[item.status] ?? 0;

    const featureItems = extraData?.featureDescendants ?? [];
    if (featureItems.length > 0) {
      // 50% strategic (SF/KR rollup) + 50% execution velocity (Feature delivery)
      return Math.round(strategicScore * 0.5 + avg(featureItems) * 0.5);
    }
    return Math.round(strategicScore);
  }

  // SuccessFactor and anything else: simple average of all children
  return Math.round(avg(children));
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

  let outcomeGrandchildren: { progressPct: number }[] | undefined;
  let featureDescendants: { progressPct: number }[] | undefined;

  if (item.type === 'KeyResult') {
    // Load Adoption+Impact grandchildren (children of Feature children)
    const featureIds = item.children
      .filter(c => c.type === 'Feature')
      .map(c => c.id);
    if (featureIds.length > 0) {
      outcomeGrandchildren = await prisma.okrItem.findMany({
        where: {
          parentId: { in: featureIds },
          type: { in: ['Adoption', 'Impact'] },
        },
        select: { progressPct: true },
      });
    }
  }

  if (item.type === 'Objective') {
    // Collect KR IDs from both paths: SF→KR and direct KR children
    const sfIds = item.children
      .filter(c => c.type === 'SuccessFactor')
      .map(c => c.id);
    const directKrIds = item.children
      .filter(c => c.type === 'KeyResult')
      .map(c => c.id);
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

  const progress = calcItemProgress(item, item.children, {
    outcomeGrandchildren,
    featureDescendants,
  });

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

    let outcomeGrandchildren: { progressPct: number }[] | undefined;
    let featureDescendants: { progressPct: number }[] | undefined;

    if (parent.type === 'KeyResult') {
      const featureIds = parent.children
        .filter(c => c.type === 'Feature')
        .map(c => c.id);
      if (featureIds.length > 0) {
        outcomeGrandchildren = await prisma.okrItem.findMany({
          where: {
            parentId: { in: featureIds },
            type: { in: ['Adoption', 'Impact'] },
          },
          select: { progressPct: true },
        });
      }
    }

    if (parent.type === 'Objective') {
      const sfIds = parent.children
        .filter(c => c.type === 'SuccessFactor')
        .map(c => c.id);
      const directKrIds = parent.children
        .filter(c => c.type === 'KeyResult')
        .map(c => c.id);
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

    const newPct = calcItemProgress(parent, parent.children, {
      outcomeGrandchildren,
      featureDescendants,
    });

    await prisma.okrItem.update({
      where: { id: parent.id },
      data: { progressPct: newPct },
    });

    current = parent;
  }
}

/**
 * Recalculate all items bottom-up in the correct order:
 * UC/Adoption/Impact → Feature → KeyResult → SuccessFactor → Objective
 */
export async function recalcAllFromScratch(): Promise<void> {
  const TYPE_ORDER = [
    'UserCapability',
    'Adoption',
    'Impact',
    'Feature',
    'KeyResult',
    'SuccessFactor',
    'Objective',
  ];

  for (const type of TYPE_ORDER) {
    const items = await prisma.okrItem.findMany({
      where: { type },
      include: { children: true },
    });

    for (const item of items) {
      let outcomeGrandchildren: { progressPct: number }[] | undefined;
      let featureDescendants: { progressPct: number }[] | undefined;

      if (type === 'KeyResult') {
        const featureIds = item.children
          .filter(c => c.type === 'Feature')
          .map(c => c.id);
        if (featureIds.length > 0) {
          outcomeGrandchildren = await prisma.okrItem.findMany({
            where: {
              parentId: { in: featureIds },
              type: { in: ['Adoption', 'Impact'] },
            },
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

      const pct = calcItemProgress(item, item.children, {
        outcomeGrandchildren,
        featureDescendants,
      });

      await prisma.okrItem.update({
        where: { id: item.id },
        data: { progressPct: pct },
      });
    }
  }
}
