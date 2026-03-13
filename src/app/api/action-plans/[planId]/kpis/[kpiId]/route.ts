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

type Params = { params: Promise<{ kpiId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { kpiId } = await params;
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

  const { kpiId } = await params;
  await prisma.kpiItem.delete({ where: { id: kpiId } });
  return NextResponse.json({ ok: true });
}
