import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q || q.trim().length < 2) {
    return NextResponse.json([]);
  }

  const results = await prisma.okrItem.findMany({
    where: {
      OR: [
        { title: { contains: q.trim() } },
        { code: { contains: q.trim() } },
      ],
    },
    select: {
      id: true,
      code: true,
      title: true,
      type: true,
      status: true,
      project: true,
      progressPct: true,
      parentId: true,
    },
    orderBy: { sortOrder: 'asc' },
    take: 20,
  });

  return NextResponse.json(results);
}
