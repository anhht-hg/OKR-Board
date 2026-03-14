import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { recalcItem, recalcAncestors } from '@/lib/progress';
import { STATUS_WEIGHT, CHILD_TYPES } from '@/lib/constants';

/** Walk up the ancestor chain to check if `ancestorId` is a descendant of `itemId`.
 *  Returns true if setting parentId would create a cycle. */
async function wouldCreateCycle(itemId: string, newParentId: string): Promise<boolean> {
  let currentId: string | null = newParentId;
  // Max depth = 20 to avoid runaway in case of existing bad data
  for (let i = 0; i < 20 && currentId; i++) {
    if (currentId === itemId) return true;
    const row: { parentId: string | null } | null = await prisma.okrItem.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    currentId = row?.parentId ?? null;
  }
  return false;
}

/** Recursively cascade chotFlag to all descendants (max 50 levels deep) */
async function cascadeChotFlag(parentId: string, flag: string, depth = 0): Promise<void> {
  if (depth > 50) return;
  const children = await prisma.okrItem.findMany({
    where: { parentId },
    select: { id: true },
  });
  if (children.length === 0) return;
  await prisma.okrItem.updateMany({
    where: { parentId },
    data: { chotFlag: flag },
  });
  await Promise.all(children.map(c => cascadeChotFlag(c.id, flag, depth + 1)));
}

/** Check if changing an item's type to `newType` is valid given its parent and children. */
async function validateTypeChange(id: string, newType: string): Promise<string | null> {
  const item = await prisma.okrItem.findUnique({
    where: { id },
    select: {
      parentId: true,
      parent: { select: { type: true } },
      children: { select: { type: true }, take: 1 },
    },
  });
  if (!item) return null;

  // Check: new type must be a valid child of its parent
  if (item.parent) {
    const allowed = CHILD_TYPES[item.parent.type] ?? [];
    if (!allowed.includes(newType)) {
      return `Không thể đổi loại thành "${newType}" — parent hiện tại (${item.parent.type}) không chấp nhận loại này.`;
    }
  }

  // Check: new type must be able to parent the existing children
  if (item.children.length > 0) {
    const childType = item.children[0].type;
    const allowedChildren = CHILD_TYPES[newType] ?? [];
    if (!allowedChildren.includes(childType)) {
      return `Không thể đổi loại thành "${newType}" — các mục con hiện tại (${childType}) không hợp lệ với loại mới.`;
    }
  }

  return null;
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
    parentId,
  } = body;

  // Capture old parentId before update (needed for re-calc if parent changes)
  const existing = await prisma.okrItem.findUnique({ where: { id }, select: { parentId: true, status: true } });
  const oldParentId = existing?.parentId ?? null;

  // Validate type change: must be compatible with parent and children
  if (type !== undefined) {
    const typeError = await validateTypeChange(id, type);
    if (typeError) return NextResponse.json({ error: typeError }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (title !== undefined) updateData.title = title;
  if (type !== undefined) updateData.type = type;
  if (status !== undefined) {
    updateData.status = status;
    updateData.progressPct = STATUS_WEIGHT[status as string] ?? 0;
    // Only set completedAt on first transition to Hoàn thành, never overwrite
    if (status === 'Hoàn thành' && existing?.status !== 'Hoàn thành') {
      updateData.completedAt = new Date();
    } else if (status !== 'Hoàn thành') {
      updateData.completedAt = null;
    }
  }
  if (project !== undefined) updateData.project = project;
  if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
  if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
  if (owner !== undefined) updateData.owner = owner;
  if (stakeholder !== undefined) updateData.stakeholder = stakeholder;
  if (chotFlag !== undefined) {
    if (chotFlag !== null && chotFlag !== 'TRUE' && chotFlag !== 'FALSE') {
      return NextResponse.json({ error: 'chotFlag chỉ chấp nhận null, "TRUE", hoặc "FALSE".' }, { status: 400 });
    }
    updateData.chotFlag = chotFlag;
  }
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
  if (parentId !== undefined) {
    const newParentId = parentId || null;
    // Prevent circular reference: new parent cannot be the item itself or any of its descendants
    if (newParentId && (newParentId === id || await wouldCreateCycle(id, newParentId))) {
      return NextResponse.json({ error: 'Không thể chọn parent này — sẽ tạo vòng lặp trong cây OKR.' }, { status: 400 });
    }
    updateData.parentId = newParentId;
  }

  const item = await prisma.okrItem.update({
    where: { id },
    data: updateData,
  });

  // Inheritance: if chotFlag changed to FALSE, cascade to all descendants
  if (chotFlag !== undefined) {
    await cascadeChotFlag(id, chotFlag);
  }

  // If parent changed: recalc old parent tree + new parent's full ancestor chain
  if (parentId !== undefined && (parentId || null) !== oldParentId) {
    if (oldParentId) await recalcItem(oldParentId);
    await recalcItem(id);
    // Also propagate progress up the new parent chain
    await recalcAncestors(id);
  } else {
    // Recalculate progress
    const childCount = await prisma.okrItem.count({ where: { parentId: id } });
    if (childCount > 0) {
      await recalcItem(id);
    } else if (status !== undefined || chotFlag !== undefined) {
      await recalcAncestors(id);
    }
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
