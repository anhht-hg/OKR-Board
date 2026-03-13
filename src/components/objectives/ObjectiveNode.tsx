'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { OkrItem } from '@/types';
import { TYPE_COLORS, TYPE_LABELS, STATUS_DOT } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown, Trash2 } from 'lucide-react';
import { KeyResultNode } from './KeyResultNode';
import { FeatureNode } from './FeatureNode';
import { isOverdue } from '@/lib/dateUtils';
import { nextStatus } from '@/lib/statusUtils';
import { useAuth } from '@/context/AuthContext';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { useTreeContext } from '@/context/TreeContext';
import { useQueryClient } from '@tanstack/react-query';

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

function renderChild(child: OkrItem, onItemClick: (id: string) => void, dragHandle?: ReactNode) {
  if (child.type === 'KeyResult') {
    return <KeyResultNode key={child.id} item={child} onItemClick={onItemClick} dragHandle={dragHandle} />;
  }
  if (child.type === 'SuccessFactor') {
    return <SuccessFactorNode key={child.id} item={child} onItemClick={onItemClick} dragHandle={dragHandle} />;
  }
  return <FeatureNode key={child.id} item={child} depth={0} onItemClick={onItemClick} dragHandle={dragHandle} />;
}

function SortableChildrenGroup({ items: initialItems, onItemClick }: { items: OkrItem[]; onItemClick: (id: string) => void }) {
  const [items, setItems] = useState(initialItems);
  const isDragging = useRef(false);
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  // Sync with parent data when not dragging
  useEffect(() => {
    if (!isDragging.current) {
      setItems(initialItems);
    }
  }, [initialItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      isDragging.current = false;
      return;
    }

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);

    setItems(reordered);

    const res = await fetch('/api/items/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: reordered.map((item, idx) => ({ id: item.id, sortOrder: idx })),
      }),
    });

    isDragging.current = false;
    if (res.ok) queryClient.invalidateQueries({ queryKey: ['objectives'] });
    else setItems(initialItems); // revert on failure
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragStart={() => { isDragging.current = true; }}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {items.map((child) => (
          <SortableItem key={child.id} id={child.id} disabled={!isAdmin}>
            {(dragHandle) => renderChild(child, onItemClick, isAdmin ? dragHandle : undefined)}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SuccessFactorNode({ item, onItemClick, dragHandle }: { item: OkrItem; onItemClick: (id: string) => void; dragHandle?: ReactNode }) {
  const [expanded, setExpanded] = useState(true);
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { compact } = useTreeContext();
  const hasChildren = item.children && item.children.length > 0;
  const overdue = isOverdue(item.endDate, item.status, item.completedAt);

  return (
    <div className="border-b border-[#e0e0e0] last:border-0">
      <div className="group flex items-center gap-2 py-3 px-5 bg-[#f8f9fa] hover:bg-[#f1f3f4] border-l-[3px] border-teal-400">
        {dragHandle}
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
            <div className="flex items-center gap-1.5 w-24">
              <div className="flex-1 h-1 bg-[#e8f0fe] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.progressPct > 100 ? 'bg-gradient-to-r from-violet-500 to-amber-400' : 'bg-[#1a73e8]'}`}
                  style={{ width: `${Math.min(Math.round(item.progressPct), 100)}%` }}
                />
              </div>
              <span className={`text-xs w-7 text-right font-semibold ${item.progressPct > 100 ? 'text-violet-600' : 'text-[#5f6368]'}`}>
                {Math.round(item.progressPct)}%
              </span>
            </div>
          )}
        </div>
      </div>
      {expanded && hasChildren && (
        <div className="pl-6">
          <SortableChildrenGroup items={item.children!} onItemClick={onItemClick} />
        </div>
      )}
    </div>
  );
}

export function ObjectiveNode({ objective, onItemClick = () => {} }: Props) {
  const [expanded, setExpanded] = useState(true);
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { compact } = useTreeContext();
  const hasChildren = objective.children && objective.children.length > 0;
  const overdue = isOverdue(objective.endDate, objective.status, objective.completedAt);

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
                const res = await fetch(`/api/items/${objective.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: nextStatus(objective.status) }),
                });
                if (res.ok) router.refresh();
              }}
            />
          ) : (
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[objective.status] || 'bg-[#5f6368]'}`} title={objective.status} />
          )}
          {!compact && (
            <span className={`text-sm font-medium ${objective.progressPct > 100 ? 'text-violet-600' : 'text-[#1a73e8]'}`}>
              {Math.round(objective.progressPct)}%
            </span>
          )}
          {isAdmin && (
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 border border-red-100 flex-shrink-0 ml-1"
              title="Xóa mục tiêu"
              onClick={async (e) => {
                e.stopPropagation();
                if (!confirm(`Xóa mục tiêu "${objective.title}"?\nTất cả dữ liệu con sẽ bị xóa. Hành động này không thể hoàn tác.`)) return;
                const res = await fetch(`/api/items/${objective.id}`, { method: 'DELETE' });
                if (res.ok) router.refresh();
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
          className={`h-full transition-all ${objective.progressPct > 100 ? 'bg-gradient-to-r from-violet-500 to-amber-400' : 'bg-[#1a73e8]'}`}
          style={{ width: `${Math.min(Math.round(objective.progressPct), 100)}%` }}
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
          <SortableChildrenGroup items={objective.children!} onItemClick={onItemClick} />
        </div>
      )}
    </div>
  );
}
