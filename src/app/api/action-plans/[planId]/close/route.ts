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

/**
 * POST /api/action-plans/[planId]/close
 *
 * Closes the current month's plan and rolls over all unfinished action items
 * (status !== 'Hoàn thành') to the next month's plan.
 *
 * - If the next month plan doesn't exist, it's created automatically.
 * - Goals are matched by title in the target plan; if a matching goal exists,
 *   items are appended to it. Otherwise a new goal is created.
 * - Returns { rolledOver, nextPlanId }
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { planId } = await params;
  try {

  // Load current plan with all goals + action items
  const plan = await prisma.actionPlan.findUnique({
    where: { id: planId },
    include: {
      goals: {
        orderBy: { sortOrder: 'asc' },
        include: { actionItems: { orderBy: { sortOrder: 'asc' } } },
      },
    },
  });
  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (plan.closedAt) return NextResponse.json({ error: 'Kế hoạch đã được kết thúc trước đó.' }, { status: 400 });

  // Calculate next month/year
  const nextMonth = plan.month === 12 ? 1 : plan.month + 1;
  const nextYear = plan.month === 12 ? plan.year + 1 : plan.year;

  // Collect unfinished items grouped by goal
  const unfinishedGoals = plan.goals
    .map(g => ({
      ...g,
      actionItems: g.actionItems.filter(i => i.status !== 'Hoàn thành'),
    }))
    .filter(g => g.actionItems.length > 0);

  const rolledOver = unfinishedGoals.reduce((sum, g) => sum + g.actionItems.length, 0);

  // Find or create the next month's plan
  let nextPlan = await prisma.actionPlan.findFirst({ where: { month: nextMonth, year: nextYear } });
  if (!nextPlan) {
    nextPlan = await prisma.actionPlan.create({
      data: {
        month: nextMonth,
        year: nextYear,
        title: `Kế hoạch tháng ${nextMonth}/${nextYear}`,
      },
    });
  }

  // Roll over unfinished items into the next plan
  for (const srcGoal of unfinishedGoals) {
    // Match goal by title in target plan, or create it
    let targetGoal = await prisma.monthlyGoal.findFirst({
      where: { planId: nextPlan.id, title: srcGoal.title },
    });
    if (!targetGoal) {
      const maxOrder = await prisma.monthlyGoal.findFirst({
        where: { planId: nextPlan.id },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });
      targetGoal = await prisma.monthlyGoal.create({
        data: {
          planId: nextPlan.id,
          title: srcGoal.title,
          okrLinkage: srcGoal.okrLinkage,
          expectedResult: srcGoal.expectedResult,
          sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
        },
      });
    }

    // Append action items to the target goal
    const maxItemOrder = await prisma.actionItem.findFirst({
      where: { goalId: targetGoal.id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    let nextOrder = (maxItemOrder?.sortOrder ?? -1) + 1;

    for (const item of srcGoal.actionItems) {
      await prisma.actionItem.create({
        data: {
          goalId: targetGoal.id,
          task: item.task,
          expectedResult: item.expectedResult,
          pic: item.pic,
          startDate: null,   // reset dates — they're from the old month
          endDate: null,
          status: 'Chưa triển khai',  // reset status to not started
          budget: item.budget,
          okrLinkage: item.okrLinkage,
          sortOrder: nextOrder++,
        },
      });
    }
  }

  // Mark current plan as closed
  await prisma.actionPlan.update({
    where: { id: planId },
    data: { closedAt: new Date() },
  });

    return NextResponse.json({ rolledOver, nextPlanId: nextPlan.id });
  } catch (err) {
    console.error('[close plan]', err);
    return NextResponse.json({ error: 'Lỗi hệ thống khi kết thúc tháng.' }, { status: 500 });
  }
}
