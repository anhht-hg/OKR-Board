'use client';

import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import { OkrItem } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { SortableItem } from './SortableItem';
import { FeatureNode } from './FeatureNode';

interface Props {
  items: OkrItem[];
  depth?: number;
  onItemClick: (id: string) => void;
}

export function SortableChildren({ items: initialItems, depth = 0, onItemClick }: Props) {
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

    setItems(reordered); // optimistic update

    await fetch('/api/items/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: reordered.map((item, idx) => ({ id: item.id, sortOrder: idx })),
      }),
    });

    isDragging.current = false;
    queryClient.invalidateQueries({ queryKey: ['objectives'] });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragStart={() => { isDragging.current = true; }}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {items.map((child) => (
          <SortableItem key={child.id} id={child.id} disabled={!isAdmin}>
            {(dragHandle) => (
              <FeatureNode
                item={child}
                depth={depth}
                onItemClick={onItemClick}
                dragHandle={isAdmin ? dragHandle : undefined}
              />
            )}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  );
}
