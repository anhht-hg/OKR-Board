import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const ancestors: { id: string; code: string | null; title: string; type: string; progressPct: number }[] = [];

  let currentId: string | null = id;

  // Walk up the tree collecting ancestors (max 10 levels to prevent infinite loops)
  for (let i = 0; i < 10 && currentId; i++) {
    const found: { id: string; code: string | null; title: string; type: string; progressPct: number; parentId: string | null } | null =
      await prisma.okrItem.findUnique({
        where: { id: currentId },
        select: { id: true, code: true, title: true, type: true, progressPct: true, parentId: true },
      });

    if (!found) break;

    ancestors.unshift({ id: found.id, code: found.code, title: found.title, type: found.type, progressPct: found.progressPct });
    currentId = found.parentId;
  }

  return NextResponse.json(ancestors);
}
