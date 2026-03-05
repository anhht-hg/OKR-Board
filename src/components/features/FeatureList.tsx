'use client';

import { useState } from 'react';
import { useItems, useDeleteItem } from '@/hooks/useObjectives';
import { OkrItem } from '@/types';
import { TYPE_COLORS, TYPE_LABELS, PROJECTS, STATUSES } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FeatureForm } from './FeatureForm';
import { Pencil, Trash2, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const FEATURE_TYPES = ['Feature', 'UserCapability', 'Adoption', 'Impact'];

const STATUS_PILL: Record<string, string> = {
  'Chưa bắt đầu': 'bg-[#f1f3f4] text-[#5f6368]',
  'Đang triển khai': 'bg-[#fef7e0] text-[#b06000]',
  'Hoàn thành': 'bg-[#e6f4ea] text-[#137333]',
};

export function FeatureList() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editItem, setEditItem] = useState<OkrItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: items = [], isLoading } = useItems({
    type: typeFilter === 'all' ? undefined : typeFilter,
    project: projectFilter === 'all' ? undefined : projectFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const deleteItem = useDeleteItem();

  const featureItems = items.filter((i) => FEATURE_TYPES.includes(i.type));

  const handleEdit = (item: OkrItem) => {
    setEditItem(item);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteItem.mutateAsync(id);
    setDeleteConfirm(null);
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 rounded-full">
            <SelectValue placeholder="Loại item" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            {FEATURE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-40 rounded-full">
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

        <div className="flex-1" />
        <Button
          size="sm"
          className="bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full"
          onClick={() => {
            setEditItem(null);
            setFormOpen(true);
          }}
        >
          <Plus size={14} className="mr-1" />
          Thêm tính năng
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8 text-[#9aa0a6]">Đang tải...</div>
      ) : featureItems.length === 0 ? (
        <div className="text-center py-8 text-[#9aa0a6]">Không có dữ liệu</div>
      ) : (
        <div className="bg-white rounded-xl border border-[#e0e0e0] overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-[#f8f9fa] border-b border-[#e0e0e0]">
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5f6368] uppercase tracking-wide">
                  Trạng thái
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5f6368] uppercase tracking-wide">
                  Owner
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#5f6368] uppercase tracking-wide">
                  Tiến độ
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {featureItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[#f1f3f4] hover:bg-[#f8f9fa]"
                >
                  <td className="px-4 py-2.5">
                    <Badge className={`text-[9px] px-1.5 py-0 ${TYPE_COLORS[item.type]}`}>
                      {TYPE_LABELS[item.type]}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-[#202124] line-clamp-2">{item.title}</span>
                  </td>
                  <td className="px-4 py-2.5 text-[#5f6368] text-xs whitespace-nowrap">
                    {item.project || '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_PILL[item.status] || 'bg-[#f1f3f4] text-[#5f6368]'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[#5f6368] text-xs">
                    {item.owner || '—'}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[#5f6368]">
                    {Math.round(item.progressPct)}%
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-[#5f6368] hover:text-[#1a73e8]"
                        onClick={() => handleEdit(item)}
                      >
                        <Pencil size={12} />
                      </Button>
                      {deleteConfirm === item.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-6 text-[10px] px-2"
                            onClick={() => handleDelete(item.id)}
                          >
                            Xóa
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px] px-2"
                            onClick={() => setDeleteConfirm(null)}
                          >
                            Hủy
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-[#ea4335] hover:text-red-600"
                          onClick={() => setDeleteConfirm(item.id)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FeatureForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditItem(null);
        }}
        editItem={editItem}
        defaultType={typeFilter || 'Feature'}
      />
    </div>
  );
}
