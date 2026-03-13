import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q || q.trim().length < 2) {
    return NextResponse.json([]);
  }

  const term = `%${q.trim().toLowerCase()}%`;

  // Use raw query with LOWER() for case-insensitive search in SQLite
  const results = await prisma.$queryRaw<Array<{
    id: string;
    code: string | null;
    title: string;
    type: string;
    status: string;
    project: string | null;
    progressPct: number;
    parentId: string | null;
  }>>`
    SELECT id, code, title, type, status, project, progressPct, parentId
    FROM OkrItem
    WHERE LOWER(title) LIKE ${term}
       OR LOWER(COALESCE(code, '')) LIKE ${term}
    ORDER BY sortOrder ASC
    LIMIT 20
  `;

  return NextResponse.json(results);
}
