'use client';

import { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OkrItem } from '@/types';
import { TYPE_COLORS, TYPE_LABELS, STATUS_DOT } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown, Trash2 } from 'lucide-react';
import { isOverdue } from '@/lib/dateUtils';
import { nextStatus } from '@/lib/statusUtils';
import { useAuth } from '@/context/AuthContext';
import { SortableChildren } from './SortableChildren';
import { useTreeContext } from '@/context/TreeContext';

const TYPE_BORDER: Record<string, string> = {
  Feature: 'border-pink-400',
  UserCapability: 'border-purple-400',
  Adoption: 'border-green-500',
  Impact: 'border-rose-400',
};

interface Props {
  item: OkrItem;
  depth?: number;
  onItemClick: (id: string) => void;
  dragHandle?: ReactNode;
}

export function FeatureNode({ item, depth = 0, onItemClick, dragHandle }: Props) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { compact } = useTreeContext();
  const hasChildren = item.children && item.children.length > 0;
  const borderColor = TYPE_BORDER[item.type] || 'border-gray-300';
  const overdue = isOverdue(item.endDate, item.status, item.completedAt);

  return (
    <div>
      <div
        className={`group flex items-center gap-2 py-2.5 hover:bg-[#f8f9fa] border-b border-[#f1f3f4] text-sm border-l-[3px] ${borderColor}`}
        style={{ paddingLeft: `${depth * 16 + 20}px` }}
      >
        {dragHandle}
        <button
          className="text-[#9aa0a6] w-4 flex-shrink-0"
          onClick={() => hasChildren && setExpanded((e) => !e)}
        >
          {hasChildren ? (
            expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
          ) : (
            <span className="block w-3 h-px bg-[#e0e0e0]" />
          )}
        </button>

        <Badge className={`text-[9px] px-1.5 py-0 flex-shrink-0 ${TYPE_COLORS[item.type]}`}>
          {TYPE_LABELS[item.type]}
        </Badge>
        {overdue && <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-200 flex-shrink-0" title="Trễ hạn" />}

        {/* Clickable title */}
        <button
          className="flex-1 text-[#202124] text-left hover:text-blue-600 cursor-pointer line-clamp-1"
          onClick={() => onItemClick(item.id)}
        >
          {item.title}
        </button>

        <div className="flex items-center gap-3 flex-shrink-0 pr-3">
          {item.project && (
            <span className="text-[10px] text-[#9aa0a6]">{item.project}</span>
          )}
          {item.owner && (
            <span className="text-[10px] text-[#9aa0a6]">{item.owner}</span>
          )}
          {isAdmin ? (
            <button
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_DOT[item.status] || 'bg-[#5f6368]'} hover:scale-125 transition-transform cursor-pointer`}
              title={`${item.status} → nhấn để đổi`}
              onClick={async (e) => {
                e.stopPropagation();
                const res = await fetch(`/api/items/${item.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: nextStatus(item.status) }),
                });
                if (res.ok) router.refresh();
              }}
            />
          ) : (
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_DOT[item.status] || 'bg-[#5f6368]'}`} title={item.status} />
          )}
          {isAdmin && (
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 border border-red-100 flex-shrink-0"
              title="Xóa"
              onClick={async (e) => {
                e.stopPropagation();
                if (!confirm(`Xóa "${item.title}"?\nHành động này không thể hoàn tác.`)) return;
                const res = await fetch(`/api/items/${item.id}`, { method: 'DELETE' });
                if (res.ok) router.refresh();
              }}
            >
              <Trash2 size={11} /> Xóa
            </button>
          )}
          {!compact && (
            <div className="flex items-center gap-1 w-20">
              <div className="flex-1 h-1 bg-[#e8f0fe] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.progressPct > 100 ? 'bg-gradient-to-r from-violet-500 to-amber-400' : 'bg-[#1a73e8]'}`}
                  style={{ width: `${Math.min(Math.round(item.progressPct), 100)}%` }}
                />
              </div>
              <span className={`text-[10px] w-6 text-right font-semibold ${item.progressPct > 100 ? 'text-violet-600' : 'text-[#5f6368]'}`}>
                {Math.round(item.progressPct)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {expanded && hasChildren && (
        <SortableChildren items={item.children!} depth={depth + 1} onItemClick={onItemClick} />
      )}
    </div>
  );
}
