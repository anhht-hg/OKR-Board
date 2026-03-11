'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OkrItem } from '@/types';
import { TYPE_COLORS, TYPE_LABELS } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown, Trash2 } from 'lucide-react';
import { KeyResultNode } from './KeyResultNode';
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
  objective: OkrItem;
  onItemClick?: (id: string) => void;
}

function countDescendants(items: OkrItem[]) {
  const counts: Record<string, number> = {};
  function walk(nodes: OkrItem[]) {
    for (const node of nodes) {
      counts[node.type] = (counts[node.type] || 0) + 1;
      if (node.children?.length) walk(node.children);
    }
  }
  walk(items);
  return counts;
}

function renderChildren(items: OkrItem[], onItemClick: (id: string) => void) {
  return items.map((child) => {
    if (child.type === 'KeyResult') {
      return <KeyResultNode key={child.id} item={child} onItemClick={onItemClick} />;
    }
    if (child.type === 'SuccessFactor') {
      return <SuccessFactorNode key={child.id} item={child} onItemClick={onItemClick} />;
    }
    return <FeatureNode key={child.id} item={child} depth={0} onItemClick={onItemClick} />;
  });
}

function SuccessFactorNode({ item, onItemClick }: { item: OkrItem; onItemClick: (id: string) => void }) {
  const [expanded, setExpanded] = useState(true);
  const router = useRouter();
  const { isAdmin } = useAuth();
  const hasChildren = item.children && item.children.length > 0;
  const overdue = isOverdue(item.endDate, item.status);

  return (
    <div className="border-b border-[#e0e0e0] last:border-0">
      <div className="group flex items-center gap-2 py-3 px-5 bg-[#f8f9fa] hover:bg-[#f1f3f4] border-l-[3px] border-teal-400">
        {/* Expand toggle */}
        <button
          className="text-[#5f6368] w-4 flex-shrink-0"
          onClick={() => hasChildren && setExpanded((e) => !e)}
        >
          {hasChildren ? (
            expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />
          ) : null}
        </button>
        <Badge className={`text-[9px] px-1.5 py-0 ${TYPE_COLORS['SuccessFactor']}`}>
          {TYPE_LABELS['SuccessFactor']}
        </Badge>
        {overdue && <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-200 flex-shrink-0" title="Trễ hạn" />}
        {/* Clickable title */}
        <button
          className="flex-1 text-sm font-medium text-[#202124] text-left hover:text-blue-600 cursor-pointer truncate"
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
          <div className="flex items-center gap-1.5 w-24">
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
      </div>
      {expanded && hasChildren && (
        <div className="pl-6">{renderChildren(item.children!, onItemClick)}</div>
      )}
    </div>
  );
}

export function ObjectiveNode({ objective, onItemClick = () => {} }: Props) {
  const [expanded, setExpanded] = useState(true);
  const router = useRouter();
  const { isAdmin } = useAuth();
  const hasChildren = objective.children && objective.children.length > 0;
  const overdue = isOverdue(objective.endDate, objective.status);

  const counts = countDescendants(objective.children || []);
  const statParts: string[] = [];
  if (counts['SuccessFactor']) statParts.push(`${counts['SuccessFactor']} Yếu tố thành công`);
  if (counts['KeyResult']) statParts.push(`${counts['KeyResult']} Kết quả then chốt`);
  if (counts['Feature']) statParts.push(`${counts['Feature']} Tính năng`);

  return (
    <div className="bg-white rounded-xl border border-[#e0e0e0] shadow-sm hover:shadow-md transition-shadow mb-6 overflow-hidden">
      {/* Header */}
      <div className="group flex items-center gap-3 px-5 py-4 hover:bg-[#f8f9fa]">
        {/* Expand toggle */}
        <button
          className="text-[#1a73e8] flex-shrink-0"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <Badge className={`text-[10px] px-2 py-0.5 flex-shrink-0 ${TYPE_COLORS['Objective']}`}>
          {objective.code || 'OBJ'}
        </Badge>
        {overdue && <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-200 flex-shrink-0" title="Trễ hạn" />}
        {/* Clickable title */}
        <button
          className="flex-1 text-sm font-semibold text-[#202124] text-left hover:text-blue-600 cursor-pointer"
          onClick={() => onItemClick(objective.id)}
        >
          {objective.title}
        </button>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isAdmin ? (
            <button
              className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[objective.status] || 'bg-[#5f6368]'} hover:scale-125 transition-transform cursor-pointer`}
              title={`${objective.status} → nhấn để đổi`}
              onClick={async (e) => {
                e.stopPropagation();
                await fetch(`/api/items/${objective.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: nextStatus(objective.status) }),
                });
                router.refresh();
              }}
            />
          ) : (
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[objective.status] || 'bg-[#5f6368]'}`} title={objective.status} />
          )}
          <span className="text-sm font-medium text-[#1a73e8]">
            {Math.round(objective.progressPct)}%
          </span>
          {isAdmin && (
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 border border-red-100 flex-shrink-0 ml-1"
              title="Xóa mục tiêu"
              onClick={async (e) => {
                e.stopPropagation();
                if (!confirm(`Xóa mục tiêu "${objective.title}"?\nTất cả dữ liệu con sẽ bị xóa. Hành động này không thể hoàn tác.`)) return;
                await fetch(`/api/items/${objective.id}`, { method: 'DELETE' });
                router.refresh();
              }}
            >
              <Trash2 size={11} /> Xóa
            </button>
          )}
        </div>
      </div>

      {/* Progress bar — full width */}
      <div className="h-1.5 bg-[#e8f0fe]">
        <div
          className="h-full bg-[#1a73e8] transition-all"
          style={{ width: `${Math.round(objective.progressPct)}%` }}
        />
      </div>

      {/* Stats row */}
      {statParts.length > 0 && (
        <div className="px-5 py-2 flex items-center gap-1 text-xs text-[#5f6368]">
          {statParts.join(' · ')}
        </div>
      )}

      {/* Children */}
      {expanded && hasChildren && (
        <div className="border-t border-[#e0e0e0]">
          {renderChildren(objective.children!, onItemClick)}
        </div>
      )}
    </div>
  );
}
