'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { ReactNode } from 'react';

interface Props {
  id: string;
  children: (dragHandle: ReactNode) => ReactNode;
  disabled?: boolean;
}

export function SortableItem({ id, children, disabled }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 10 : undefined,
  };

  const dragHandle = disabled ? null : (
    <span
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing text-[#c0c4c8] hover:text-[#9aa0a6] flex-shrink-0 touch-none"
      title="Kéo để sắp xếp"
    >
      <GripVertical size={13} />
    </span>
  );

  return (
    <div ref={setNodeRef} style={style}>
      {children(dragHandle)}
    </div>
  );
}
