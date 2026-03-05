import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const objectives = await prisma.okrItem.findMany({
    where: { type: 'Objective' },
    orderBy: { sortOrder: 'asc' },
    include: {
      children: {
        orderBy: { sortOrder: 'asc' },
        include: {
          children: {
            orderBy: { sortOrder: 'asc' },
            include: {
              children: {
                orderBy: { sortOrder: 'asc' },
                include: {
                  children: { orderBy: { sortOrder: 'asc' } },
                },
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json(objectives);
}
