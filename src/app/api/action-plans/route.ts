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

export async function GET() {
  const plans = await prisma.actionPlan.findMany({
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    include: { _count: { select: { goals: true, kpis: true } } },
  });
  return NextResponse.json(plans);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { month, year, title, notes } = await req.json();

  if (!month || !year || !title) {
    return NextResponse.json({ error: 'month, year và title là bắt buộc' }, { status: 400 });
  }
  if (month < 1 || month > 12) {
    return NextResponse.json({ error: 'Tháng phải từ 1 đến 12' }, { status: 400 });
  }

  const existing = await prisma.actionPlan.findFirst({ where: { month, year } });
  if (existing) {
    return NextResponse.json({ error: `Đã có kế hoạch tháng ${month}/${year}` }, { status: 400 });
  }

  const plan = await prisma.actionPlan.create({
    data: { month, year, title, notes: notes || null },
  });
  return NextResponse.json(plan, { status: 201 });
}
