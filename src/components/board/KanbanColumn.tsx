'use client';

import { OkrItem } from '@/types';
import { KanbanCard } from './KanbanCard';

interface Props {
  title: string;
  items: OkrItem[];
  color: string;
}

export function KanbanColumn({ title, items, color }: Props) {
  return (
    <div className="bg-[#f8f9fa] rounded-xl p-3 flex-1 min-w-[280px]">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <span className="text-sm font-semibold text-[#202124]">{title}</span>
        <span className="ml-auto text-xs font-medium text-white bg-[#1a73e8] rounded-full px-2 py-0.5">
          {items.length}
        </span>
      </div>
      <div className="space-y-2 min-h-[100px]">
        {items.length === 0 ? (
          <div className="text-center py-8 text-[#9aa0a6] text-xs border-2 border-dashed border-[#e0e0e0] rounded-lg">
            Không có item
          </div>
        ) : (
          items.map((item) => <KanbanCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}
