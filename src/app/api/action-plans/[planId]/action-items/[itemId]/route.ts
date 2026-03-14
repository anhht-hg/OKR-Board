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

type Params = { params: Promise<{ planId: string; itemId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { planId, itemId } = await params;
  const existing = await prisma.actionItem.findUnique({
    where: { id: itemId },
    select: { goal: { select: { planId: true } } },
  });
  if (!existing || existing.goal.planId !== planId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const { task, expectedResult, pic, startDate, endDate, status, budget, okrLinkage } = body;

  const item = await prisma.actionItem.update({
    where: { id: itemId },
    data: {
      ...(task !== undefined && { task }),
      ...(expectedResult !== undefined && { expectedResult: expectedResult || null }),
      ...(pic !== undefined && { pic: pic || null }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(status !== undefined && { status }),
      ...(budget !== undefined && { budget: budget || null }),
      ...(okrLinkage !== undefined && { okrLinkage: okrLinkage || null }),
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { planId, itemId } = await params;
  const existing = await prisma.actionItem.findUnique({
    where: { id: itemId },
    select: { goal: { select: { planId: true } } },
  });
  if (!existing || existing.goal.planId !== planId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.actionItem.delete({ where: { id: itemId } });
  return NextResponse.json({ ok: true });
}
