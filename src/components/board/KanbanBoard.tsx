'use client';

import { useState } from 'react';
import { useItems } from '@/hooks/useObjectives';
import { OkrItem } from '@/types';
import { PROJECTS, TYPE_LABELS, ALL_TYPES } from '@/lib/constants';
import { KanbanColumn } from './KanbanColumn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const COLUMNS = [
  { status: 'Chưa bắt đầu', color: 'bg-gray-400', label: 'Chưa bắt đầu' },
  { status: 'Đang triển khai', color: 'bg-orange-400', label: 'Đang triển khai' },
  { status: 'Hoàn thành', color: 'bg-green-500', label: 'Hoàn thành' },
];

export function KanbanBoard() {
  const [typeFilter, setTypeFilter] = useState('Feature');
  const [projectFilter, setProjectFilter] = useState('all');

  const { data: items = [], isLoading } = useItems({
    type: typeFilter === 'all' ? undefined : typeFilter,
    project: projectFilter === 'all' ? undefined : projectFilter,
  });

  if (isLoading) {
    return <div className="text-center py-12 text-gray-400">Đang tải...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44">
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
          <SelectTrigger className="w-40">
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

        <span className="text-sm text-gray-500 ml-2">{items.length} items</span>
      </div>

      <div className="flex gap-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.status}
            title={col.label}
            color={col.color}
            items={items.filter((i: OkrItem) => i.status === col.status)}
          />
        ))}
      </div>
    </div>
  );
}
