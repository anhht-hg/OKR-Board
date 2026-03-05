'use client';

import { useState } from 'react';
import { OkrItem } from '@/types';
import { TYPE_COLORS, TYPE_LABELS, PROJECTS, STATUSES, ALL_TYPES } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { useItems, useUpdateItem } from '@/hooks/useObjectives';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

const STATUS_PILL: Record<string, string> = {
  'Chưa bắt đầu': 'bg-[#f1f3f4] text-[#5f6368]',
  'Đang triển khai': 'bg-[#fef7e0] text-[#b06000]',
  'Hoàn thành': 'bg-[#e6f4ea] text-[#137333]',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function OKRTable() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'sortOrder' | 'progressPct' | 'status'>('sortOrder');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const { data: items = [], isLoading } = useItems({
    type: typeFilter === 'all' ? undefined : typeFilter,
    project: projectFilter === 'all' ? undefined : projectFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search.length >= 2 ? search : undefined,
  });

  const updateItem = useUpdateItem();

  const sorted = [...items].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    const cmp = (aVal as number | string) < (bVal as number | string) ? -1 : (aVal as number | string) > (bVal as number | string) ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 border border-[#e0e0e0] rounded-full px-3 py-1.5 bg-white">
          <Search size={14} className="text-[#5f6368]" />
          <input
            type="text"
            placeholder="Tìm kiếm tiêu đề..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm outline-none w-48 text-[#202124] placeholder:text-[#9aa0a6]"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 rounded-full">
            <SelectValue placeholder="Loại item" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            {ALL_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-36 rounded-full">
            <SelectValue placeholder="Dự án" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả dự án</SelectItem>
            {PROJECTS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 rounded-full">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-sm text-[#5f6368] ml-auto">
          {items.length} items
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-[#9aa0a6]">Đang tải...</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 text-[#9aa0a6]">Không có dữ liệu</div>
      ) : (
        <div className="bg-white rounded-xl border border-[#e0e0e0] overflow-hidden overflow-x-auto shadow-sm">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-[#f8f9fa] border-b border-[#e0e0e0] sticky top-0">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5f6368] uppercase tracking-wide">
                  Loại
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5f6368] uppercase tracking-wide">
                  Tiêu đề
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5f6368] uppercase tracking-wide">
                  Dự án
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-[#5f6368] uppercase tracking-wide cursor-pointer hover:text-[#1a73e8]"
                  onClick={() => toggleSort('status')}
                >
                  Trạng thái {sortField === 'status' && (
                    <span className="text-[#1a73e8]">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5f6368] uppercase tracking-wide">
                  Ngày bắt đầu
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5f6368] uppercase tracking-wide">
                  Ngày KT
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5f6368] uppercase tracking-wide">
                  Owner
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-[#5f6368] uppercase tracking-wide cursor-pointer hover:text-[#1a73e8]"
                  onClick={() => toggleSort('progressPct')}
                >
                  Tiến độ {sortField === 'progressPct' && (
                    <span className="text-[#1a73e8]">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item) => (
                <ItemRow key={item.id} item={item} onStatusChange={async (status) => {
                  await updateItem.mutateAsync({ id: item.id, data: { status: status as import('@/types').Status } });
                }} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ItemRow({ item, onStatusChange }: { item: OkrItem; onStatusChange: (s: string) => void }) {
  const statusPill = STATUS_PILL[item.status] || 'bg-[#f1f3f4] text-[#5f6368]';
  return (
    <tr className="border-b border-[#f1f3f4] hover:bg-[#f8f9fa]">
      <td className="px-4 py-2.5">
        <Badge className={`text-[9px] px-1.5 py-0 ${TYPE_COLORS[item.type]}`}>
          {TYPE_LABELS[item.type]}
        </Badge>
      </td>
      <td className="px-4 py-2.5 max-w-xs">
        <span className="text-[#202124] line-clamp-2 text-xs">{item.title}</span>
      </td>
      <td className="px-4 py-2.5 text-[#5f6368] text-xs whitespace-nowrap">
        {item.project || '—'}
      </td>
      <td className="px-4 py-2.5">
        <Select value={item.status} onValueChange={onStatusChange}>
          <SelectTrigger className={`h-6 text-[10px] border-0 rounded-full w-36 ${statusPill}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-4 py-2.5 text-[#5f6368] text-xs whitespace-nowrap">
        {formatDate(item.startDate)}
      </td>
      <td className="px-4 py-2.5 text-[#5f6368] text-xs whitespace-nowrap">
        {formatDate(item.endDate)}
      </td>
      <td className="px-4 py-2.5 text-[#5f6368] text-xs">
        {item.owner || '—'}
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-1.5 w-20">
          <div className="flex-1 h-1.5 bg-[#e8f0fe] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1a73e8] rounded-full"
              style={{ width: `${Math.round(item.progressPct)}%` }}
            />
          </div>
          <span className="text-[10px] text-[#5f6368] w-6 text-right">
            {Math.round(item.progressPct)}%
          </span>
        </div>
      </td>
    </tr>
  );
}
