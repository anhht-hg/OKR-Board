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
  const { metric, target, actual, note } = await req.json();

  if (!metric) return NextResponse.json({ error: 'metric là bắt buộc' }, { status: 400 });

  const max = await prisma.kpiItem.findFirst({
    where: { planId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });

  const kpi = await prisma.kpiItem.create({
    data: {
      planId,
      metric,
      target: target || null,
      actual: actual || null,
      note: note || null,
      sortOrder: (max?.sortOrder ?? -1) + 1,
    },
  });
  return NextResponse.json(kpi, { status: 201 });
}
