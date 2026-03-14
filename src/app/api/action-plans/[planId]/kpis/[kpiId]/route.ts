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

type Params = { params: Promise<{ planId: string; kpiId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { planId, kpiId } = await params;
  const existing = await prisma.kpiItem.findUnique({ where: { id: kpiId }, select: { planId: true } });
  if (!existing || existing.planId !== planId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { metric, target, actual, note } = await req.json();

  const kpi = await prisma.kpiItem.update({
    where: { id: kpiId },
    data: {
      ...(metric !== undefined && { metric }),
      ...(target !== undefined && { target: target || null }),
      ...(actual !== undefined && { actual: actual || null }),
      ...(note !== undefined && { note: note || null }),
    },
  });
  return NextResponse.json(kpi);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { planId, kpiId } = await params;
  const existing = await prisma.kpiItem.findUnique({ where: { id: kpiId }, select: { planId: true } });
  if (!existing || existing.planId !== planId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.kpiItem.delete({ where: { id: kpiId } });
  return NextResponse.json({ ok: true });
}
