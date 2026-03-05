import prisma from './prisma';
import { STATUS_WEIGHT } from './constants';

export async function recalcAncestors(itemId: string): Promise<void> {
  let current = await prisma.okrItem.findUnique({ where: { id: itemId } });
  while (current?.parentId) {
    const parent = await prisma.okrItem.findUnique({
      where: { id: current.parentId },
      include: { children: true },
    });
    if (!parent) break;
    const avg =
      parent.children.length > 0
        ? parent.children.reduce((s, c) => s + c.progressPct, 0) /
          parent.children.length
        : STATUS_WEIGHT[parent.status] ?? 0;
    await prisma.okrItem.update({
      where: { id: parent.id },
      data: { progressPct: Math.round(avg) },
    });
    current = parent;
  }
}

export async function recalcItem(itemId: string): Promise<void> {
  const item = await prisma.okrItem.findUnique({
    where: { id: itemId },
    include: { children: true },
  });
  if (!item) return;

  const progress =
    item.children.length === 0
      ? STATUS_WEIGHT[item.status] ?? 0
      : Math.round(
          item.children.reduce((s, c) => s + c.progressPct, 0) /
            item.children.length
        );

  await prisma.okrItem.update({
    where: { id: itemId },
    data: { progressPct: progress },
  });

  await recalcAncestors(itemId);
}
