import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { recalcItem, recalcAncestors } from '@/lib/progress';
import { STATUS_WEIGHT } from '@/lib/constants';

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
    status,
    project,
    startDate,
    endDate,
    owner,
    stakeholder,
    chotFlag,
    isOptional,
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
  if (isOptional !== undefined) updateData.isOptional = isOptional;
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

  // Recalculate progress: if this is a leaf (no children), recalculate from status
  const childCount = await prisma.okrItem.count({ where: { parentId: id } });
  if (childCount === 0 && status !== undefined) {
    // progressPct already set above; cascade up
    await recalcAncestors(id);
  } else if (childCount > 0) {
    await recalcItem(id);
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
