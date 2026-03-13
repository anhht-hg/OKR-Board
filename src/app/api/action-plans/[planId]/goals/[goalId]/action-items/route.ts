import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

async function requireAdmin() {
  const jar = await cookies();
  if (jar.get('okr_role')?.value !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

type Params = { params: Promise<{ goalId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { goalId } = await params;
  const { task, expectedResult, pic, startDate, endDate, status, budget, okrLinkage } = await req.json();

  if (!task) return NextResponse.json({ error: 'task là bắt buộc' }, { status: 400 });

  const max = await prisma.actionItem.findFirst({
    where: { goalId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });

  const item = await prisma.actionItem.create({
    data: {
      goalId,
      task,
      expectedResult: expectedResult || null,
      pic: pic || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status: status || 'Chưa triển khai',
      budget: budget || null,
      okrLinkage: okrLinkage || null,
      sortOrder: (max?.sortOrder ?? -1) + 1,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
