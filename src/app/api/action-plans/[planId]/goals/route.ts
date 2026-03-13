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

type Params = { params: Promise<{ planId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { planId } = await params;
  const { title, okrLinkage, expectedResult } = await req.json();

  if (!title) return NextResponse.json({ error: 'title là bắt buộc' }, { status: 400 });

  const max = await prisma.monthlyGoal.findFirst({
    where: { planId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });

  const goal = await prisma.monthlyGoal.create({
    data: {
      planId,
      title,
      okrLinkage: okrLinkage || null,
      expectedResult: expectedResult || null,
      sortOrder: (max?.sortOrder ?? -1) + 1,
    },
    include: { actionItems: true },
  });
  return NextResponse.json(goal, { status: 201 });
}
