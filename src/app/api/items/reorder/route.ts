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

// PATCH /api/items/reorder
// Body: { items: [{ id: string, sortOrder: number }] }
export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { items } = await req.json() as { items: { id: string; sortOrder: number }[] };

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'items array required' }, { status: 400 });
  }

  // Validate all items exist and share the same parent
  const records = await prisma.okrItem.findMany({
    where: { id: { in: items.map((i) => i.id) } },
    select: { id: true, parentId: true },
  });

  if (records.length !== items.length) {
    return NextResponse.json({ error: 'Some items not found' }, { status: 404 });
  }

  const parentIds = new Set(records.map((r) => r.parentId));
  if (parentIds.size > 1) {
    return NextResponse.json({ error: 'All items must share the same parent' }, { status: 400 });
  }

  await Promise.all(
    items.map(({ id, sortOrder }) =>
      prisma.okrItem.update({ where: { id }, data: { sortOrder } })
    )
  );

  return NextResponse.json({ ok: true });
}
