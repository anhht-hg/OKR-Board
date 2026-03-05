import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { recalcAncestors } from '@/lib/progress';
import { STATUS_WEIGHT } from '@/lib/constants';

async function requireAdmin() {
  const jar = await cookies();
  if (jar.get('okr_role')?.value !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get('type') || undefined;
  const project = searchParams.get('project') || undefined;
  const status = searchParams.get('status') || undefined;
  const search = searchParams.get('search') || undefined;
  const parentId = searchParams.get('parentId') || undefined;

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (project) where.project = project;
  if (status) where.status = status;
  if (parentId) where.parentId = parentId;
  if (search)
    where.title = { contains: search };

  const items = await prisma.okrItem.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }],
    include: { children: { orderBy: { sortOrder: 'asc' } } },
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json();
  const {
    title,
    type,
    parentId,
    project,
    status = 'Chưa bắt đầu',
    startDate,
    endDate,
    owner,
    stakeholder,
    code,
    description,
    successMetric,
    targetValue,
    measureFormula,
    corporateKRLinkage,
    notes,
    strategicPillar,
    deadline,
    pic,
    scope,
    chotFlag,
  } = body;

  if (!title || !type) {
    return NextResponse.json({ error: 'title and type are required' }, { status: 400 });
  }

  // Get max sortOrder for same parent
  const maxOrder = await prisma.okrItem.findFirst({
    where: { parentId: parentId || null },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });

  const item = await prisma.okrItem.create({
    data: {
      title,
      type,
      parentId: parentId || null,
      project: project || null,
      status,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      owner: owner || null,
      stakeholder: stakeholder || null,
      code: code || null,
      description: description || null,
      successMetric: successMetric || null,
      targetValue: targetValue || null,
      measureFormula: measureFormula || null,
      corporateKRLinkage: corporateKRLinkage || null,
      notes: notes || null,
      strategicPillar: strategicPillar || null,
      deadline: deadline || null,
      pic: pic || null,
      scope: scope || null,
      chotFlag: chotFlag || null,
      sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
      progressPct: STATUS_WEIGHT[status as string] ?? 0,
    },
  });

  // Cascade progress up
  if (parentId) await recalcAncestors(item.id);

  return NextResponse.json(item, { status: 201 });
}
