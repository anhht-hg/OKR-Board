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

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { searchParams } = req.nextUrl;
  const action = searchParams.get('action') || undefined;      // CREATED | UPDATED | DELETED
  const itemType = searchParams.get('itemType') || undefined;  // Objective | Feature | ...
  const field = searchParams.get('field') || undefined;        // status | owner | ...
  const dateFrom = searchParams.get('dateFrom') || undefined;  // ISO date string
  const dateTo = searchParams.get('dateTo') || undefined;      // ISO date string
  const search = searchParams.get('search') || undefined;      // search by item title
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

  const where: Record<string, unknown> = {};
  if (action) where.action = action;
  if (itemType) where.itemType = itemType;
  if (field) where.field = field;
  if (search) where.itemTitle = { contains: search };
  if (dateFrom || dateTo) {
    const createdAt: Record<string, Date> = {};
    if (dateFrom) createdAt.gte = new Date(dateFrom);
    if (dateTo) {
      // Include the full dateTo day
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      createdAt.lte = end;
    }
    where.createdAt = createdAt;
  }

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({ logs, total, page, limit });
}
