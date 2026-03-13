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

export async function GET(_req: NextRequest, { params }: Params) {
  const { planId } = await params;
  const plan = await prisma.actionPlan.findUnique({
    where: { id: planId },
    include: {
      goals: {
        orderBy: { sortOrder: 'asc' },
        include: { actionItems: { orderBy: { sortOrder: 'asc' } } },
      },
      kpis: { orderBy: { sortOrder: 'asc' } },
    },
  });
  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(plan);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { planId } = await params;
  const { title, notes } = await req.json();

  const plan = await prisma.actionPlan.update({
    where: { id: planId },
    data: {
      ...(title !== undefined && { title }),
      ...(notes !== undefined && { notes: notes || null }),
    },
  });
  return NextResponse.json(plan);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { planId } = await params;
  await prisma.actionPlan.delete({ where: { id: planId } });
  return NextResponse.json({ ok: true });
}
