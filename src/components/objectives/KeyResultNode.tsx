'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OkrItem } from '@/types';
import { TYPE_COLORS, TYPE_LABELS } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown, Trash2 } from 'lucide-react';
import { FeatureNode } from './FeatureNode';
import { isOverdue } from '@/lib/dateUtils';
import { nextStatus } from '@/lib/statusUtils';
import { useAuth } from '@/context/AuthContext';

const STATUS_DOT: Record<string, string> = {
  'Chưa bắt đầu': 'bg-[#5f6368]',
  'Đang triển khai': 'bg-[#fbbc04]',
  'Hoàn thành': 'bg-[#34a853]',
};

interface Props {
  item: OkrItem;
  onItemClick: (id: string) => void;
}

export function KeyResultNode({ item, onItemClick }: Props) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const { isAdmin } = useAuth();
  const hasChildren = item.children && item.children.length > 0;
  const overdue = isOverdue(item.endDate, item.status);

  return (
    <div className="border-b border-[#e0e0e0] last:border-0">
      <div className="group flex items-center gap-2 py-3 px-5 hover:bg-[#f8f9fa] border-l-[3px] border-slate-500">
        <button
          className="text-[#5f6368] w-4 flex-shrink-0"
          onClick={() => hasChildren && setExpanded((e) => !e)}
        >
          {hasChildren ? (
            expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />
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
          className="flex-1 text-sm text-[#202124] text-left hover:text-blue-600 cursor-pointer pl-1 truncate"
          onClick={() => onItemClick(item.id)}
        >
          {item.code && <span className="font-bold text-gray-400 mr-1.5 text-xs">{item.code}</span>}
          {item.title}
        </button>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isAdmin ? (
            <button
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_DOT[item.status] || 'bg-[#5f6368]'} hover:scale-125 transition-transform cursor-pointer`}
              title={`${item.status} → nhấn để đổi`}
              onClick={async (e) => {
                e.stopPropagation();
                await fetch(`/api/items/${item.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: nextStatus(item.status) }),
                });
                router.refresh();
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
                await fetch(`/api/items/${item.id}`, { method: 'DELETE' });
                router.refresh();
              }}
            >
              <Trash2 size={11} /> Xóa
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 w-28">
          <div className="flex-1 h-1 bg-[#e8f0fe] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1a73e8] rounded-full"
              style={{ width: `${Math.round(item.progressPct)}%` }}
            />
          </div>
          <span className="text-xs text-[#5f6368] w-7 text-right">
            {Math.round(item.progressPct)}%
          </span>
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="border-t border-[#f1f3f4]">
          {item.children!.map((child) => (
            <FeatureNode key={child.id} item={child} depth={1} onItemClick={onItemClick} />
          ))}
        </div>
      )}
    </div>
  );
}
