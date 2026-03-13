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

export async function PATCH(req: NextRequest, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { goalId } = await params;
  const { title, okrLinkage, expectedResult, sortOrder } = await req.json();

  const goal = await prisma.monthlyGoal.update({
    where: { id: goalId },
    data: {
      ...(title !== undefined && { title }),
      ...(okrLinkage !== undefined && { okrLinkage: okrLinkage || null }),
      ...(expectedResult !== undefined && { expectedResult: expectedResult || null }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
    include: { actionItems: { orderBy: { sortOrder: 'asc' } } },
  });
  return NextResponse.json(goal);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { goalId } = await params;
  await prisma.monthlyGoal.delete({ where: { id: goalId } });
  return NextResponse.json({ ok: true });
}
