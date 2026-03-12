'use client';

import { useState } from 'react';
import { ObjectiveNode } from './ObjectiveNode';
import { ItemDetailDrawer } from '@/components/dashboard/ItemDetailDrawer';
import { TreeContext } from '@/context/TreeContext';
import { useObjectives } from '@/hooks/useObjectives';

export function ObjectiveTree() {
  const [drawerItemId, setDrawerItemId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: objectives = [], isLoading } = useObjectives();

  function handleItemClick(id: string) {
    setDrawerItemId(id);
    setDrawerOpen(true);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (objectives.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        Không có dữ liệu
      </div>
    );
  }

  return (
    <TreeContext.Provider value={{ compact: drawerOpen }}>
      <div style={{ paddingRight: drawerOpen ? 'calc(42vw + 16px)' : 0, transition: 'padding-right 0.3s ease' }}>
        {objectives.map((obj) => (
          <ObjectiveNode key={obj.id} objective={obj} onItemClick={handleItemClick} />
        ))}
      </div>

      <ItemDetailDrawer
        itemId={drawerItemId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </TreeContext.Provider>
  );
}
