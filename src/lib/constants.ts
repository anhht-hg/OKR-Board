export const STATUS_COLORS: Record<string, string> = {
  'Chưa bắt đầu': 'bg-gray-100 text-gray-500',
  'Đang triển khai': 'bg-orange-100 text-orange-700',
  'Hoàn thành': 'bg-green-100 text-green-700',
};

export const STATUS_BADGE_COLORS: Record<string, string> = {
  'Chưa bắt đầu': 'bg-gray-200 text-gray-600 border-gray-300',
  'Đang triển khai': 'bg-orange-100 text-orange-700 border-orange-300',
  'Hoàn thành': 'bg-green-100 text-green-700 border-green-300',
};

export const TYPE_COLORS: Record<string, string> = {
  Objective: 'bg-blue-600 text-white',
  SuccessFactor: 'bg-teal-500 text-white',
  KeyResult: 'bg-slate-700 text-white',
  Feature: 'bg-pink-400 text-white',
  UserCapability: 'bg-purple-500 text-white',
  Adoption: 'bg-green-600 text-white',
  Impact: 'bg-rose-400 text-white',
};

export const TYPE_LABELS: Record<string, string> = {
  Objective: 'Mục tiêu',
  SuccessFactor: 'Yếu tố thành công',
  KeyResult: 'Kết quả then chốt',
  Feature: 'Tính năng',
  UserCapability: 'Năng lực người dùng',
  Adoption: 'Mức độ tiếp nhận',
  Impact: 'Tác động',
};

export const PROJECTS = [
  'HG Stock',
  'QL Kênh',
  'Tài chính',
  'Quản lý NS',
  'Dữ liệu & Báo cáo',
];

export const STATUSES = ['Chưa bắt đầu', 'Đang triển khai', 'Hoàn thành'];

export const STATUS_WEIGHT: Record<string, number> = {
  'Hoàn thành': 100,
  'Đang triển khai': 50,
  'Chưa bắt đầu': 0,
};

export const CHILD_TYPES: Record<string, string[]> = {
  Objective: ['SuccessFactor'],
  SuccessFactor: ['KeyResult'],
  KeyResult: ['Feature'],
  Feature: ['UserCapability', 'Adoption', 'Impact'],
};

export const ALL_TYPES = [
  'Objective',
  'SuccessFactor',
  'KeyResult',
  'Feature',
  'UserCapability',
  'Adoption',
  'Impact',
];

// Status dot (indicator) colors — shared across all node components
export const STATUS_DOT: Record<string, string> = {
  'Chưa bắt đầu': 'bg-[#5f6368]',
  'Đang triển khai': 'bg-[#fbbc04]',
  'Hoàn thành': 'bg-[#34a853]',
};

// Next child type in hierarchy (used for "add child" actions)
export const NEXT_CHILD_TYPE: Record<string, string> = {
  Objective: 'SuccessFactor',
  SuccessFactor: 'KeyResult',
  KeyResult: 'Feature',
  Feature: 'UserCapability',
};

// ─── Action Plan statuses ────────────────────────────────────────────────────

export const ACTION_ITEM_STATUSES = ['Chưa triển khai', 'Đang làm', 'Hoàn thành'] as const;

export const ACTION_STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'Chưa triển khai': { bg: 'bg-gray-100',    text: 'text-gray-500',   dot: 'bg-gray-400'   },
  'Đang làm':        { bg: 'bg-orange-100',  text: 'text-orange-700', dot: 'bg-orange-400' },
  'Hoàn thành':      { bg: 'bg-emerald-100', text: 'text-emerald-700',dot: 'bg-emerald-500'},
};

// ─────────────────────────────────────────────────────────────────────────────

// Human-readable audit log field labels (Vietnamese)
export const AUDIT_FIELD_LABELS: Record<string, string> = {
  title: 'Tên',
  type: 'Loại',
  status: 'Trạng thái',
  project: 'Dự án',
  owner: 'Người phụ trách',
  stakeholder: 'Stakeholder',
  startDate: 'Ngày bắt đầu',
  endDate: 'Ngày kết thúc',
  chotFlag: 'Chốt',
  code: 'Mã',
  notes: 'Ghi chú',
  description: 'Mô tả',
  successMetric: 'Chỉ số thành công',
  targetValue: 'Giá trị mục tiêu',
  measureFormula: 'Công thức đo',
  corporateKRLinkage: 'Liên kết KR công ty',
  strategicPillar: 'Trụ cột chiến lược',
  deadline: 'Deadline',
  pic: 'PIC',
  scope: 'Phạm vi',
  parentId: 'Item cha',
  progressPct: 'Tiến độ (%)',
};

// Required parent type for each child type (inverse of CHILD_TYPES)
export const PARENT_TYPE: Record<string, string> = {
  SuccessFactor: 'Objective',
  KeyResult: 'SuccessFactor',
  Feature: 'KeyResult',
  UserCapability: 'Feature',
  Adoption: 'Feature',
  Impact: 'Feature',
};
