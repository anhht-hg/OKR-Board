import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { recalcItem, recalcAncestors } from '@/lib/progress';
import { STATUS_WEIGHT } from '@/lib/constants';

/** Recursively cascade chotFlag to all descendants */
async function cascadeChotFlag(parentId: string, flag: string): Promise<void> {
  const children = await prisma.okrItem.findMany({
    where: { parentId },
    select: { id: true },
  });
  if (children.length === 0) return;
  await prisma.okrItem.updateMany({
    where: { parentId },
    data: { chotFlag: flag },
  });
  await Promise.all(children.map(c => cascadeChotFlag(c.id, flag)));
}

async function requireAdmin() {
  const jar = await cookies();
  if (jar.get('okr_role')?.value !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const item = await prisma.okrItem.findUnique({
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

  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json();

  const {
    title,
    type,
    status,
    project,
    startDate,
    endDate,
    owner,
    stakeholder,
    chotFlag,
    code,
    notes,
    description,
    successMetric,
    targetValue,
    measureFormula,
    corporateKRLinkage,
    strategicPillar,
    deadline,
    pic,
    scope,
  } = body;

  const updateData: Record<string, unknown> = {};
  if (title !== undefined) updateData.title = title;
  if (type !== undefined) updateData.type = type;
  if (status !== undefined) {
    updateData.status = status;
    updateData.progressPct = STATUS_WEIGHT[status as string] ?? 0;
  }
  if (project !== undefined) updateData.project = project;
  if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
  if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
  if (owner !== undefined) updateData.owner = owner;
  if (stakeholder !== undefined) updateData.stakeholder = stakeholder;
  if (chotFlag !== undefined) updateData.chotFlag = chotFlag;
  if (code !== undefined) updateData.code = code;
  if (notes !== undefined) updateData.notes = notes;
  if (description !== undefined) updateData.description = description;
  if (successMetric !== undefined) updateData.successMetric = successMetric;
  if (targetValue !== undefined) updateData.targetValue = targetValue;
  if (measureFormula !== undefined) updateData.measureFormula = measureFormula;
  if (corporateKRLinkage !== undefined) updateData.corporateKRLinkage = corporateKRLinkage;
  if (strategicPillar !== undefined) updateData.strategicPillar = strategicPillar;
  if (deadline !== undefined) updateData.deadline = deadline;
  if (pic !== undefined) updateData.pic = pic;
  if (scope !== undefined) updateData.scope = scope;

  const item = await prisma.okrItem.update({
    where: { id },
    data: updateData,
  });

  // Inheritance: if chotFlag changed to FALSE, cascade to all descendants
  if (chotFlag !== undefined) {
    await cascadeChotFlag(id, chotFlag);
  }

  // Recalculate progress
  const childCount = await prisma.okrItem.count({ where: { parentId: id } });
  if (childCount > 0) {
    // Has children: recalc this item bottom-up (recalcItem also calls recalcAncestors)
    await recalcItem(id);
  } else if (status !== undefined || chotFlag !== undefined) {
    // Leaf item with status or chotFlag change: propagate up the ancestor chain
    await recalcAncestors(id);
  }

  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

  const item = await prisma.okrItem.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const parentId = item.parentId;
  await prisma.okrItem.delete({ where: { id } });

  if (parentId) await recalcItem(parentId);

  return NextResponse.json({ success: true });
}
