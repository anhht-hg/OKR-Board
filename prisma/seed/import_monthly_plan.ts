import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

// Initialization logic matching src/lib/prisma.ts
const dbUrl = process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), 'dev.db')}`;
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('Bắt đầu import dữ liệu kế hoạch tháng...');
  
  // Đọc dữ liệu đã parse
  const dataPath = path.join(process.cwd(), 'parsed_plan.json');
  if (!fs.existsSync(dataPath)) {
      console.error(`Không tìm thấy file parsed_plan.json tại ${dataPath}`);
      return;
  }
  
  const parsedData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`Đã load data Tháng ${parsedData.month}/${parsedData.year}`);

  // Xóa plan cũ nếu có (bởi vì đã có onDelete: Cascade nên các bảng con cũng bị xóa)
  await prisma.actionPlan.deleteMany({
    where: {
      month: parsedData.month,
      year: parsedData.year
    }
  });

  // Tạo ActionPlan mới
  const newPlan = await prisma.actionPlan.create({
    data: {
      month: parsedData.month,
      year: parsedData.year,
      title: parsedData.title,
      notes: "Imported from Google Sheets"
    }
  });
  console.log(`Đã tạo ActionPlan: ${newPlan.id}`);

  // Import Goals
  let goalCounter = 0;
  const goalMap = new Map<string, string>(); // sortOrder -> dbId

  for (const goal of parsedData.goals) {
    const dbGoal = await prisma.monthlyGoal.create({
      data: {
        planId: newPlan.id,
        sortOrder: goal.sortOrder,
        title: goal.title,
        okrLinkage: goal.okrLinkage,
        expectedResult: goal.expectedResult
      }
    });
    // Gán ID theo title để Action Item tham chiếu
    goalMap.set((goal.title || '').trim().toLowerCase(), dbGoal.id);
    goalCounter++;
  }
  console.log(`Đã import ${goalCounter} Monthly Goals.`);

  // Import Action Items
  let actionItemCounter = 0;
  for (const item of parsedData.actionItems) {
    const parentGoalKey = (item.goalTitle || '').trim().toLowerCase();
    const parentId = goalMap.get(parentGoalKey);

    if (!parentId) {
      console.warn(`[CẢNH BÁO] Không tìm thấy Goal cha cho action item: ${item.task}`);
      continue; // Skip or handle orphan items
    }

    await prisma.actionItem.create({
      data: {
        goalId: parentId,
        sortOrder: item.sortOrder || 0,
        task: item.task,
        expectedResult: item.expectedResult,
        pic: item.pic,
        status: item.status || "Chưa triển khai",
        budget: item.budget,
        okrLinkage: item.okrLinkage
      }
    });
    actionItemCounter++;
  }
  console.log(`Đã import ${actionItemCounter} Action Items.`);

  // Import KPIs
  let kpiCounter = 0;
  for (const kpi of parsedData.kpis) {
    await prisma.kpiItem.create({
      data: {
        planId: newPlan.id,
        sortOrder: kpi.sortOrder,
        metric: kpi.metric,
        target: kpi.target,
        actual: kpi.actual,
        note: kpi.note
      }
    });
    kpiCounter++;
  }
  console.log(`Đã import ${kpiCounter} KPIs.`);

  console.log('Import hoàn tất!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
