'use client';

import { useState } from 'react';
import { OkrItem } from '@/types';
import { ObjectiveNode } from './ObjectiveNode';
import { ItemDetailDrawer } from '@/components/dashboard/ItemDetailDrawer';

interface Props {
  objectives: OkrItem[];
}

export function ObjectiveTree({ objectives }: Props) {
  const [drawerItemId, setDrawerItemId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleItemClick(id: string) {
    setDrawerItemId(id);
    setDrawerOpen(true);
  }

  if (objectives.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        Không có dữ liệu
      </div>
    );
  }

  return (
    <>
      <div>
        {objectives.map((obj) => (
          <ObjectiveNode key={obj.id} objective={obj} onItemClick={handleItemClick} />
        ))}
      </div>

      <ItemDetailDrawer
        itemId={drawerItemId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </>
  );
}
