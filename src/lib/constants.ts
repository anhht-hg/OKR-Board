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
  Objective: 'Objectives',
  SuccessFactor: 'Success Factor',
  KeyResult: 'Key Result',
  Feature: 'Feature',
  UserCapability: 'User Capability',
  Adoption: 'Adoption',
  Impact: 'Impact',
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
