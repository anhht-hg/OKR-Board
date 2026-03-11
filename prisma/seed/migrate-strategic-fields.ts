/**
 * One-time migration: populate strategic fields from hardcoded OBJ_META into the DB.
 * Run: npx tsx prisma/seed/migrate-strategic-fields.ts
 */
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter } as any);

interface KrMeta { ketQua: string; target: string; thuocDo: string; lienKet: string; }
interface SfMeta { description: string; owner?: string; deadline?: string; notes?: string; krs: KrMeta[]; }
interface ObjMeta { pillar: string; deadline: string; pic: string; scope: string; sfs: Record<string, SfMeta>; }

const OBJ_META: Record<string, ObjMeta> = {
  '01': {
    pillar: 'Tăng trưởng – Quay lại vị thế', deadline: '–', pic: 'Giám đốc CNVH',
    scope: 'RedOne, An Tuệ, Forest Music, HG Entertainment',
    sfs: {
      'KR-1': {
        description: 'Xây dựng công cụ giúp người quản lý phân phối tài nguyên cho các công ty/phòng MKT nhanh chóng, chính xác và giảm tồn đọng.',
        owner: 'Quản lý dự án HG Stock',
        krs: [
          { ketQua: 'Thời gian thao tác phân phối giảm 50% so với hiện tại', target: 'Giảm 50% thời gian thao tác phân phối', thuocDo: 'Thời gian từ lúc bắt đầu thao tác phân phối đến khi bấm phân phối', lienKet: 'Phân phối nhanh & đúng = MKT không chờ tài nguyên = duy trì tốc độ sản xuất phục vụ 1M USD/tháng' },
          { ketQua: '"Tài nguyên cần phân phối ngay" được phân phối trong thời gian SLA', target: '95% tài nguyên "cần phân phối ngay" đạt SLA', thuocDo: '% tài nguyên được phân phối đúng SLA / tổng tài nguyên cần phân phối ngay', lienKet: 'Tài nguyên từ HG Ent được phân phối kịp thời, không tồn đọng lãng phí' },
        ],
      },
      'KR-2': {
        description: 'Cải thiện trải nghiệm tìm kiếm, nghe thử/xem thử và tải tài nguyên trên HGStock để nhân sự MKT thao tác nhanh và chọn đúng tài nguyên cần.',
        owner: 'Quản lý dự án HG Stock',
        krs: [
          { ketQua: '≥ 80% tài nguyên được tải/sử dụng đến từ việc tự khám phá (search, browse) trên HGStock thay vì Click link', target: '≥80% tài nguyên tải từ browsing/search thay vì click link', thuocDo: '% tài nguyên được tải từ browsing HG Stock / tổng tài nguyên được tải', lienKet: 'Nhân sự tìm & dùng nhanh = tăng sản lượng video/ngày = đẩy nhanh đến 1M USD/tháng' },
          { ketQua: 'Trải nghiệm preview & tải mượt mà', target: 'Preview: Time to Play <2s; Buffer <1%; Tải: Tốc độ ≥10MB/s; Tỷ lệ thành công ≥99%', thuocDo: 'Time to Play; % thời gian buffer; tỉ lệ preview thành công; tốc độ download trung bình (MB/s); tỉ lệ tải thành công', lienKet: 'Trải nghiệm mượt mà trực tiếp giảm thời gian chờ của nhân sự MKT trong quy trình sản xuất' },
          { ketQua: '70% "tài nguyên cần phân phối ngay" có lượt sử dụng đầu trong vòng 30 ngày sau phân phối', target: '≥70% tài nguyên có lượt sử dụng đầu trong vòng 30 ngày sau phân phối', thuocDo: '% tài nguyên có lượt sử dụng / tổng tài nguyên được phân phối', lienKet: 'Đảm bảo tài nguyên được phân phối thực sự được khai thác, không lãng phí công sức sản xuất' },
        ],
      },
      'KR-3': {
        description: 'Xây dựng hệ thống báo cáo theo dõi hiệu quả doanh thu tài nguyên để định hướng sản xuất.',
        owner: 'Quản lý dự án HG Stock',
        krs: [
          { ketQua: 'Báo cáo hiệu quả sử dụng tài nguyên được cập nhật tự động với data cập nhật ≤24h', target: 'Data delay ≤24h; uptime báo cáo ≥99%', thuocDo: 'Độ trễ data và tỷ lệ uptime của dashboard', lienKet: 'Dữ liệu hiệu quả giúp HG Ent sản xuất đúng catalog, đúng chất lượng, đúng sản lượng' },
          { ketQua: '≥95% tài nguyên trong kho được tracking đầy đủ trong báo cáo', target: '≥95% tài nguyên có đủ metadata để tracking', thuocDo: '% tài nguyên có đủ metadata / tổng tài nguyên trong kho', lienKet: 'Không tracking đủ = không có dữ liệu để ra quyết định sản xuất' },
          { ketQua: 'Báo cáo phủ đủ 100% metric cốt lõi đã thống nhất vs CEO HG', target: '100% metric cốt lõi được hiển thị: tỷ lệ sử dụng, tần suất, tài nguyên chưa khai thác, tài nguyên hot, phân bổ theo kênh, view', thuocDo: '% metric được hiển thị trên báo cáo / metric được yêu cầu', lienKet: 'CEO HG cần đủ góc nhìn để ra quyết định sản xuất chiến lược' },
          { ketQua: 'Có các quyết định sản xuất được đưa ra dựa trên data từ dashboard', target: '≥3 quyết định sản xuất/quý được ghi nhận có reference từ báo cáo', thuocDo: 'Số quyết định sản xuất có trích dẫn data từ hệ thống (khảo sát adoption thực tế)', lienKet: 'Đây là KR đo lường adoption thực sự — data phải được dùng, không chỉ tồn tại' },
        ],
      },
    },
  },
  '02': {
    pillar: 'Tăng trưởng – Quay lại vị thế', deadline: 'T6/2026', pic: 'Giám đốc CNVH',
    scope: 'RedOne, An Tuệ, Forest Music',
    sfs: {
      'KR-1': {
        description: 'Tự động kiểm tra tuân thủ hệ thống quy định kênh trước khi nội dung lên sóng và trong quá trình vận hành.',
        owner: 'Quản lý dự án QL kênh', deadline: 'T6/2026',
        krs: [
          { ketQua: 'Tỷ lệ nội dung được scan tự động là 100%', target: '100% video của kênh thuộc net được scan tự động', thuocDo: '% video được scan / tổng video trong network', lienKet: 'Phòng ngừa từ gốc = giảm số sự cố = bảo vệ doanh thu 1M USD/tháng' },
          { ketQua: '90% quy định trọng yếu được kiểm tra bằng hệ thống scan tự động', target: '≥90% quy định trọng yếu được cover bởi automation scan', thuocDo: '% quy định có scan tự động / tổng quy định cần kiểm tra', lienKet: 'Cần làm rõ với MKT các loại quy định nào là trọng yếu trước khi triển khai' },
          { ketQua: 'Không để xảy ra sự cố nghiêm trọng có nguyên nhân từ vi phạm quy định đã ban hành mà hệ thống không phát hiện được', target: '0 sự cố/tháng có nguyên nhân từ vi phạm mà hệ thống không phát hiện được', thuocDo: 'Số sự cố xảy ra/tháng mà hệ thống không phát hiện được', lienKet: 'Zero-miss trên vi phạm đã có quy định = bảo vệ hoàn toàn doanh thu khỏi rủi ro có thể kiểm soát' },
        ],
      },
      'KR-2': {
        description: 'Xây dựng công cụ và quy trình giúp đội vận hành xử lý sự cố kênh (strike, claim, tắt kiếm tiền) nhanh và hiệu quả hơn.',
        owner: 'Quản lý dự án QL kênh', deadline: 'T4/2026',
        krs: [
          { ketQua: 'Thời gian từ lúc hệ thống hoặc nhân sự phát hiện sự cố đến lúc ticket xử lý được tạo trên hệ thống phải dưới 2h', target: '≤2 giờ từ phát hiện sự cố đến khi tạo ticket', thuocDo: 'Thời gian phản hồi trung bình (phát hiện → tạo ticket)', lienKet: 'Xử lý nhanh = khôi phục doanh thu nhanh, giảm thời gian kênh "chết"' },
          { ketQua: 'Thời gian từ khi vận hành bắt đầu xử lý đến khi sự cố được xử lý xong trong SLA', target: 'Claim: ≤2 ngày; Strike: ≤7 ngày; Tắt kiếm tiền: ≤5 ngày', thuocDo: 'Thời gian xử lý trung bình theo loại sự cố', lienKet: 'Mỗi ngày kênh bị tắt kiếm tiền = mất doanh thu trực tiếp — SLA nghiêm ngặt bảo vệ revenue' },
          { ketQua: 'Tỷ lệ xử lý thành công (dispute thành công, claim released, kênh được BKT lại...)', target: '≥70% tỷ lệ xử lý thành công', thuocDo: '% thành công / tổng số ticket (dispute thành công, claim released, kênh sống lại)', lienKet: 'Tỷ lệ thành công cao = đội vận hành có tool đúng và quy trình đúng để chiến đấu lại với YouTube' },
        ],
      },
      'KR-3': {
        description: 'Xây dựng hệ thống giám sát real-time toàn bộ kênh, tự động phát hiện và cảnh báo dấu hiệu rủi ro trước khi trở thành sự cố nghiêm trọng.',
        owner: 'Quản lý dự án QL kênh', deadline: 'T6/2026',
        notes: 'Phía MKT không ưu tiên cao — triển khai sau KR1 & KR2',
        krs: [
          { ketQua: 'Tỷ lệ kênh được giám sát & cảnh báo tự động đạt 100%', target: '100% kênh trong network được monitor', thuocDo: '% kênh được monitor / tổng kênh', lienKet: 'Bảo vệ doanh thu 1M USD/tháng, phát hiện rủi ro sớm = giảm mất kênh' },
          { ketQua: 'Thời gian từ lúc sự cố xảy ra đến lúc đội vận hành/quản lý nhận cảnh báo ≤15 phút', target: '≤15 phút từ khi sự cố xảy ra đến khi nhận cảnh báo', thuocDo: 'Thời gian phát hiện trung bình (sự cố xảy ra → cảnh báo gửi đến)', lienKet: 'Phát hiện trong 15 phút = can thiệp trước khi YouTube ra quyết định phạt nặng' },
          { ketQua: 'Tỷ lệ sự cố không được cảnh báo tự động <1%', target: '<1% sự cố không được tự động phát hiện', thuocDo: '% sự cố không được phát hiện tự động / tổng sự cố', lienKet: 'Gần như mọi sự cố đều được phát hiện tự động — con người chỉ cần xử lý, không cần canh màn hình' },
        ],
      },
    },
  },
  '04': {
    pillar: 'Vận hành – Cải thiện nội lực', deadline: 'T9/2026', pic: 'Trưởng phòng CN',
    scope: 'Ban Tài chính, Ban CN',
    sfs: {
      'KR-1': {
        description: 'Xây dựng hệ thống quản lý ngân sách tự động để theo dõi và kiểm soát chi phí hiệu quả.',
        owner: 'Quản lý dự án Tài chính',
        krs: [
          { ketQua: 'Báo cáo ngân sách được cập nhật tự động hàng tuần', target: '100% báo cáo ngân sách được tự động hóa', thuocDo: 'Số báo cáo tự động / tổng báo cáo yêu cầu', lienKet: 'Tiết kiệm thời gian tổng hợp số liệu, tập trung vào phân tích chiến lược' },
          { ketQua: 'Độ chính xác số liệu ngân sách ≥99%', target: '≥99% độ chính xác so với sổ sách kế toán', thuocDo: 'Tỷ lệ chênh lệch số liệu giữa hệ thống và kế toán', lienKet: 'Số liệu chính xác là nền tảng để ra quyết định tài chính đúng đắn' },
        ],
      },
      'KR-2': {
        description: 'Chuẩn hóa quy trình phê duyệt chi phí để tăng tốc độ và minh bạch.',
        owner: 'Quản lý dự án Tài chính',
        krs: [
          { ketQua: 'Thời gian phê duyệt chi phí giảm xuống còn 1 ngày làm việc', target: '≤1 ngày làm việc cho mỗi vòng phê duyệt', thuocDo: 'Thời gian trung bình từ khi tạo yêu cầu đến khi được phê duyệt', lienKet: 'Phê duyệt nhanh = giải phóng nguồn lực cho các dự án chiến lược' },
          { ketQua: '100% yêu cầu chi phí được xử lý qua hệ thống (không còn email/zalo)', target: '0 yêu cầu chi phí xử lý ngoài hệ thống', thuocDo: 'Số yêu cầu xử lý ngoài hệ thống / tổng yêu cầu', lienKet: 'Minh bạch hóa toàn bộ luồng chi phí, dễ audit và báo cáo' },
        ],
      },
    },
  },
  '05': {
    pillar: 'Năng lực – Đội ngũ vững mạnh', deadline: 'T12/2026', pic: 'Giám đốc CNVH',
    scope: 'Ban CN & Vận hành',
    sfs: {
      'KR-1': {
        description: 'Xây dựng bộ khung năng lực và lộ trình phát triển cho từng vị trí trong Ban CN.',
        owner: 'Trưởng nhóm phát triển nhân sự',
        krs: [
          { ketQua: '100% nhân sự có lộ trình phát triển cá nhân (IDP) rõ ràng', target: '100% nhân sự có IDP được cập nhật ít nhất 1 lần/quý', thuocDo: '% nhân sự có IDP / tổng nhân sự Ban CN', lienKet: 'Nhân sự có lộ trình rõ ràng = gắn kết hơn và tự chủ hơn trong phát triển' },
          { ketQua: 'NPS nội bộ về môi trường làm việc ≥7/10', target: 'eNPS ≥ 7.0 điểm trong khảo sát hàng quý', thuocDo: 'Điểm eNPS từ khảo sát nội bộ hàng quý', lienKet: 'Môi trường tốt = giảm tỷ lệ nghỉ việc và thu hút nhân tài' },
        ],
      },
      'KR-2': {
        description: 'Nâng cao kỹ năng kỹ thuật và nghiệp vụ cho đội ngũ CN thông qua chương trình đào tạo có hệ thống.',
        owner: 'Trưởng nhóm phát triển nhân sự',
        krs: [
          { ketQua: '≥80% nhân sự hoàn thành chương trình đào tạo kỹ thuật theo kế hoạch năm', target: '≥80% nhân sự đạt chứng chỉ hoặc hoàn thành khóa học theo IDP', thuocDo: '% nhân sự hoàn thành đào tạo / tổng nhân sự có kế hoạch đào tạo', lienKet: 'Kỹ năng tốt hơn = code chất lượng hơn, ít bug hơn, giao hàng nhanh hơn' },
          { ketQua: 'Tỷ lệ áp dụng kiến thức sau đào tạo vào công việc ≥70%', target: '≥70% nhân sự có thể kể tên 1 cải tiến cụ thể trong công việc sau đào tạo', thuocDo: 'Khảo sát 30 ngày sau đào tạo: % áp dụng được', lienKet: 'Đào tạo chỉ có giá trị khi được áp dụng thực tế — đây là KR đo lường ROI thực sự' },
        ],
      },
    },
  },
  '06': {
    pillar: 'Vận hành – Cải thiện nội lực', deadline: 'T12/2026', pic: 'Giám đốc CNVH',
    scope: 'Toàn Ban CN & Vận hành',
    sfs: {
      'KR-1': {
        description: 'Xây dựng hệ thống data warehouse tập trung để hỗ trợ ra quyết định dựa trên dữ liệu.',
        owner: 'Trưởng nhóm Data',
        krs: [
          { ketQua: 'Dữ liệu từ tất cả hệ thống chính được tích hợp vào data warehouse', target: '100% hệ thống cốt lõi có pipeline vào data warehouse', thuocDo: 'Số hệ thống đã tích hợp / tổng hệ thống cần tích hợp', lienKet: 'Single source of truth = mọi bộ phận dùng cùng một số liệu, không tranh cãi về data' },
          { ketQua: 'Dashboard báo cáo cho C-level được cập nhật tự động hàng ngày', target: 'Data freshness ≤24h cho tất cả dashboard C-level', thuocDo: 'Thời gian trễ tối đa của data trên dashboard', lienKet: 'C-level ra quyết định dựa trên data mới nhất, không phải số liệu cũ 1 tuần' },
        ],
      },
      'KR-2': {
        description: 'Tự động hóa báo cáo định kỳ để giảm thời gian làm báo cáo thủ công.',
        owner: 'Trưởng nhóm Data',
        krs: [
          { ketQua: '≥80% báo cáo định kỳ được tự động hóa hoàn toàn', target: '≥80% báo cáo không cần tác động thủ công', thuocDo: '% báo cáo chạy tự động / tổng số báo cáo định kỳ', lienKet: 'Giải phóng ít nhất 20h/tuần công sức làm báo cáo thủ công trong toàn tổ chức' },
          { ketQua: 'Thời gian tạo báo cáo ad-hoc giảm từ ngày xuống còn giờ', target: 'Ad-hoc report: ≤4 giờ từ yêu cầu đến kết quả', thuocDo: 'Thời gian trung bình từ khi nhận yêu cầu đến khi gửi báo cáo', lienKet: 'Tốc độ cung cấp insight = tốc độ ra quyết định = lợi thế cạnh tranh' },
        ],
      },
    },
  },
};

async function migrateObj(objCode: string, meta: ObjMeta) {
  const obj = await prisma.okrItem.findFirst({ where: { type: 'Objective', code: { startsWith: objCode } } });
  if (!obj) { console.log(`OBJ ${objCode} not found, skipping`); return; }

  await prisma.okrItem.update({ where: { id: obj.id }, data: { strategicPillar: meta.pillar, deadline: meta.deadline, pic: meta.pic, scope: meta.scope } });
  console.log(`✓ OBJ ${objCode}`);

  const children = await prisma.okrItem.findMany({ where: { parentId: obj.id }, orderBy: { sortOrder: 'asc' }, select: { id: true, type: true, code: true } });

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type !== 'SuccessFactor') continue;

    const sfMeta = meta.sfs[child.code ?? ''];
    if (sfMeta) {
      await prisma.okrItem.update({ where: { id: child.id }, data: { description: sfMeta.description, owner: sfMeta.owner ?? null, notes: sfMeta.notes ?? null } });
      console.log(`  ✓ SF ${child.code}`);
    }

    // KRs are siblings following this SF until the next SF
    const nextSfIdx = children.findIndex((c, j) => j > i && c.type === 'SuccessFactor');
    const sfKrs = children.slice(i + 1, nextSfIdx === -1 ? undefined : nextSfIdx).filter(c => c.type === 'KeyResult');

    for (let k = 0; k < sfKrs.length; k++) {
      const krMeta = sfMeta?.krs?.[k];
      if (!krMeta) continue;
      await prisma.okrItem.update({
        where: { id: sfKrs[k].id },
        data: { successMetric: krMeta.ketQua, targetValue: krMeta.target, measureFormula: krMeta.thuocDo, corporateKRLinkage: krMeta.lienKet },
      });
      console.log(`    ✓ KR[${k}] ${sfKrs[k].id.substring(0, 12)}...`);
    }
  }
}

async function main() {
  console.log('Migrating strategic fields to DB...\n');
  for (const [code, meta] of Object.entries(OBJ_META)) {
    await migrateObj(code, meta);
  }
  console.log('\nDone!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
