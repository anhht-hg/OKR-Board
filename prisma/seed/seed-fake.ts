import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as path from 'path';

const projectRoot = path.resolve(__dirname, '../../..');
const dbUrl = process.env.DATABASE_URL || `file:${path.join(projectRoot, 'dev.db')}`;
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🌱 Seeding fake OKR data...');

  // Clear existing data
  await prisma.okrItem.deleteMany({});
  console.log('🗑️  Cleared existing data');

  // =============================================
  // OBJECTIVE 1: Market Leader
  // =============================================
  const obj1 = await prisma.okrItem.create({
    data: {
      id: 'obj-01',
      code: 'OBJ-01',
      title: 'Xây dựng hệ thống quản lý tài nguyên giúp quản lý phân phối nhanh - nhân sự tìm kiếm hiệu quả 🎯',
      type: 'Objective',
      sortOrder: 1,
      status: 'Đang triển khai',
      progressPct: 0,
      strategicPillar: 'Growth & Efficiency',
    },
  });

  const sf1_1 = await prisma.okrItem.create({
    data: {
      id: 'sf-01-1',
      code: 'SF-01-1',
      title: 'Tối ưu hóa quy trình quản lý kho tài nguyên',
      type: 'SuccessFactor',
      sortOrder: 1,
      status: 'Đang triển khai',
      parentId: obj1.id,
      progressPct: 0,
    },
  });

  const kr1_1 = await prisma.okrItem.create({
    data: {
      id: 'kr-01-1',
      code: 'KR-1',
      title: 'Người phân phối kho có thể phân phối nhanh chóng, chính xác và giảm tồn đọng 📦',
      type: 'KeyResult',
      sortOrder: 1,
      status: 'Đang triển khai',
      parentId: sf1_1.id,
      project: 'HG Stock',
      owner: 'Quang',
      progressPct: 0,
    },
  });

  // Features under KR-1
  const fe1_1 = await prisma.okrItem.create({
    data: {
      id: 'fe-01-1',
      code: 'FE-1',
      title: 'Nhập liệu & Chuẩn hóa Metadata',
      type: 'Feature',
      sortOrder: 1,
      status: 'Hoàn thành',
      parentId: kr1_1.id,
      project: 'HG Stock',
      owner: 'Minh',
    },
  });

  await prisma.okrItem.createMany({
    data: [
      {
        id: 'uc-01-1-1',
        title: 'Hệ thống bổ sung đầy đủ các trường metadata còn thiếu cho tài nguyên trong kho',
        type: 'UserCapability',
        sortOrder: 1,
        status: 'Hoàn thành',
        parentId: fe1_1.id,
        project: 'HG Stock',
        owner: 'Quang',
        progressPct: 100,
      },
      {
        id: 'uc-01-1-2',
        title: 'Nhân sự VH có thể bổ sung metadata hàng loạt cho tài nguyên cũ',
        type: 'UserCapability',
        sortOrder: 2,
        status: 'Hoàn thành',
        parentId: fe1_1.id,
        project: 'HG Stock',
        owner: 'Minh',
        progressPct: 100,
      },
      {
        id: 'ad-01-1-1',
        title: 'Trên 80% nhân sự VH sử dụng công cụ Excel hoặc Bulk Edit nâng cao',
        type: 'Adoption',
        sortOrder: 3,
        status: 'Hoàn thành',
        parentId: fe1_1.id,
        project: 'HG Stock',
        progressPct: 100,
      },
      {
        id: 'im-01-1-1',
        title: 'Giảm ít nhất 80% trường hợp phân phối thừa hoặc nhầm loại do lỗi metadata',
        type: 'Impact',
        sortOrder: 4,
        status: 'Hoàn thành',
        parentId: fe1_1.id,
        project: 'HG Stock',
        progressPct: 100,
      },
    ],
  });

  const fe1_2 = await prisma.okrItem.create({
    data: {
      id: 'fe-01-2',
      code: 'FE-2',
      title: 'Phân phối tài nguyên theo yêu cầu mới',
      type: 'Feature',
      sortOrder: 2,
      status: 'Đang triển khai',
      parentId: kr1_1.id,
      project: 'HG Stock',
      owner: 'Hùng',
    },
  });

  await prisma.okrItem.createMany({
    data: [
      {
        id: 'uc-01-2-1',
        title: 'Vận hành và Trợ lý GĐ có thể thực hiện phân phối tài nguyên chỉ trong 3 bước',
        type: 'UserCapability',
        sortOrder: 1,
        status: 'Hoàn thành',
        parentId: fe1_2.id,
        project: 'HG Stock',
        owner: 'Hùng',
        progressPct: 100,
      },
      {
        id: 'ad-01-2-1',
        title: 'Trên 70% nhân sự Vận hành sử dụng bộ lọc trạng thái và sắp xếp tự động',
        type: 'Adoption',
        sortOrder: 2,
        status: 'Chưa bắt đầu',
        parentId: fe1_2.id,
        project: 'HG Stock',
        progressPct: 0,
      },
      {
        id: 'im-01-2-1',
        title: 'Tỉ lệ sai sót trong phân phối giảm ít nhất 90% so với quy trình cũ',
        type: 'Impact',
        sortOrder: 3,
        status: 'Chưa bắt đầu',
        parentId: fe1_2.id,
        project: 'HG Stock',
        progressPct: 0,
      },
    ],
  });

  // =============================================
  // OBJECTIVE 2: Product Excellence
  // =============================================
  const obj2 = await prisma.okrItem.create({
    data: {
      id: 'obj-02',
      code: 'OBJ-02',
      title: 'Elevate Product Excellence to Unprecedented Levels 🚀',
      type: 'Objective',
      sortOrder: 2,
      status: 'Đang triển khai',
      progressPct: 0,
      strategicPillar: 'Product & Technology',
    },
  });

  const sf2_1 = await prisma.okrItem.create({
    data: {
      id: 'sf-02-1',
      code: 'SF-02-1',
      title: 'Nâng cao chất lượng sản phẩm toàn diện',
      type: 'SuccessFactor',
      sortOrder: 1,
      status: 'Đang triển khai',
      parentId: obj2.id,
      progressPct: 0,
    },
  });

  const kr2_1 = await prisma.okrItem.create({
    data: {
      id: 'kr-02-1',
      code: 'TEC-4',
      title: 'Enhance customer support processes',
      type: 'KeyResult',
      sortOrder: 1,
      status: 'Đang triển khai',
      parentId: sf2_1.id,
      project: 'QL Kênh',
      owner: 'Hương',
      progressPct: 0,
    },
  });

  // Add a feature for TEC-4
  await prisma.okrItem.create({
    data: {
      id: 'fe-02-1-1',
      code: 'FE-3',
      title: 'Hệ thống Ticketing thông minh',
      type: 'Feature',
      sortOrder: 1,
      status: 'Đang triển khai',
      parentId: kr2_1.id,
      project: 'QL Kênh',
      progressPct: 50,
    },
  });

  // =============================================
  // Recalculate progress bottom-up
  // =============================================
  console.log('📊 Recalculating progress...');

  const STATUS_WEIGHT: Record<string, number> = {
    'Hoàn thành': 100,
    'Đang triển khai': 50,
    'Chưa bắt đầu': 0,
  };

  const typeOrder = [
    'UserCapability',
    'Adoption',
    'Impact',
    'Feature',
    'KeyResult',
    'SuccessFactor',
    'Objective',
  ];
  for (const type of typeOrder) {
    const items = await prisma.okrItem.findMany({
      where: { type },
      include: { children: true },
    });
    for (const item of items) {
      let progress: number;
      if (item.children.length === 0) {
        // If we already set progressPct above (like for UC/Adoption), use it. 
        // Otherwise use status weight.
        progress = item.progressPct > 0 ? item.progressPct : (STATUS_WEIGHT[item.status] ?? 0);
      } else {
        const avg = item.children.reduce((s, c) => s + c.progressPct, 0) / item.children.length;
        progress = Math.round(avg);
      }
      await prisma.okrItem.update({
        where: { id: item.id },
        data: { progressPct: progress },
      });
    }
  }

  // Print summary
  const counts = await prisma.okrItem.groupBy({ by: ['type'], _count: true });
  console.log('\n📊 Summary:');
  counts.forEach((c) => console.log(`  ${c.type}: ${c._count}`));

  const objectives = await prisma.okrItem.findMany({
    where: { type: 'Objective' },
    orderBy: { sortOrder: 'asc' },
    select: { code: true, title: true, progressPct: true },
  });
  console.log('\n🎯 Objectives:');
  objectives.forEach((o) => console.log(`  ${o.code} — ${o.progressPct}% — ${o.title}`));

  console.log('\n✅ Fake data seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
