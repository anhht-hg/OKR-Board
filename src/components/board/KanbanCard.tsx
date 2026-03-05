'use client';

import { useState } from 'react';
import { OkrItem, Status } from '@/types';
import { TYPE_COLORS, TYPE_LABELS, STATUSES } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateItem } from '@/hooks/useObjectives';

const TYPE_BORDER: Record<string, string> = {
  Feature: 'border-l-pink-400',
  UserCapability: 'border-l-purple-400',
  Adoption: 'border-l-green-500',
  Impact: 'border-l-rose-400',
  KeyResult: 'border-l-slate-500',
  SuccessFactor: 'border-l-teal-400',
  Objective: 'border-l-[#1a73e8]',
};

interface Props {
  item: OkrItem;
}

export function KanbanCard({ item }: Props) {
  const updateItem = useUpdateItem();
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    await updateItem.mutateAsync({ id: item.id, data: { status: newStatus as Status } });
    setUpdating(false);
  };

  const borderColor = TYPE_BORDER[item.type] || 'border-l-gray-300';
  const initials = item.owner
    ? item.owner.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : null;

  return (
    <div className={`bg-white rounded-lg border border-[#e0e0e0] border-l-[3px] ${borderColor} p-3 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start gap-2 mb-2">
        <Badge className={`text-[9px] px-1.5 py-0 flex-shrink-0 mt-0.5 ${TYPE_COLORS[item.type]}`}>
          {TYPE_LABELS[item.type]}
        </Badge>
        {item.code && (
          <span className="text-[10px] text-[#9aa0a6] flex-shrink-0">{item.code}</span>
        )}
      </div>
      <p className="text-xs text-[#202124] mb-3 line-clamp-3">{item.title}</p>
      <div className="flex items-center gap-2 mb-2">
        {item.project && (
          <span className="text-[10px] text-[#5f6368] truncate flex-1">{item.project}</span>
        )}
        <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
          <div className="w-12 h-1 bg-[#e8f0fe] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1a73e8] rounded-full"
              style={{ width: `${Math.round(item.progressPct)}%` }}
            />
          </div>
          <span className="text-[10px] text-[#5f6368]">{Math.round(item.progressPct)}%</span>
        </div>
      </div>
      {initials && (
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-6 h-6 rounded-full bg-[#e8f0fe] text-[#1a73e8] text-[10px] flex items-center justify-center font-medium flex-shrink-0">
            {initials}
          </div>
          <span className="text-[10px] text-[#5f6368] truncate">{item.owner}</span>
        </div>
      )}
      <Select value={item.status} onValueChange={handleStatusChange} disabled={updating}>
        <SelectTrigger className="h-6 text-[10px] border-[#e0e0e0] rounded-full">
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
    </div>
  );
}
