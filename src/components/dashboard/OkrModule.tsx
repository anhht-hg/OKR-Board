'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardStats } from '@/types';
import { NEXT_CHILD_TYPE } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ObjectiveCard } from './ObjectiveCard';
import { ObjectiveChildList } from './ObjectiveChildList';
import { ItemDetailDrawer } from './ItemDetailDrawer';
import { CreateItemDrawer } from './CreateItemDrawer';
import { ChevronDown, Plus, Target, Layers, Calculator, Briefcase, Users, TrendingUp, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Props {
  stats: DashboardStats;
}

const CREATE_TYPES = [
  { value: 'Objective',      label: 'Objective',        bg: 'bg-blue-100',   text: 'text-blue-600',   icon: Target },
  { value: 'SuccessFactor',  label: 'Success Factor',   bg: 'bg-teal-100',   text: 'text-teal-600',   icon: Layers },
  { value: 'KeyResult',      label: 'Key Result',       bg: 'bg-slate-100',  text: 'text-slate-600',  icon: Calculator },
  { value: 'Feature',        label: 'Feature',          bg: 'bg-pink-100',   text: 'text-pink-600',   icon: Briefcase },
  { value: 'UserCapability', label: 'User Capability',  bg: 'bg-purple-100', text: 'text-purple-600', icon: Users },
  { value: 'Adoption',       label: 'Adoption',         bg: 'bg-green-100',  text: 'text-green-600',  icon: TrendingUp },
  { value: 'Impact',         label: 'Impact',           bg: 'bg-rose-100',   text: 'text-rose-600',   icon: Zap },
];

function CreateDropdown({ onSelect }: { onSelect: (type: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-3 text-[11px] font-bold uppercase tracking-tight border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Create
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={4} className="w-52 p-1">
        {CREATE_TYPES.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              onClick={() => { onSelect(t.value); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors rounded"
            >
              <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${t.bg} ${t.text}`}>
                <Icon size={13} />
              </div>
              {t.label}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

export function OkrModule({ stats }: Props) {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(
    stats.objectivesWithChildren[0]?.id || null
  );
  const [expandAll, setExpandAll] = useState(false);
  const [drawerItemId, setDrawerItemId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Create drawer state
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [createItemType, setCreateItemType] = useState('Objective');
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [createParentType, setCreateParentType] = useState<string | null>(null);

  function handleItemClick(id: string) {
    setDrawerItemId(id);
    setDrawerOpen(true);
  }

  function handleCreate(type: string) {
    setCreateItemType(type);
    setCreateParentId(null);
    setCreateParentType(null);
    setCreateDrawerOpen(true);
  }

  function handleCreateChild(parentId: string, parentType: string) {
    const nextType = NEXT_CHILD_TYPE[parentType];
    if (!nextType) return;
    setCreateItemType(nextType);
    setCreateParentId(parentId);
    setCreateParentType(parentType);
    setCreateDrawerOpen(true);
  }

  const selectedObjective = stats.objectivesWithChildren.find((o) => o.id === selectedId);
  const avgPct = stats.avgObjectiveProgress;

  function getAvgProgressBarColor(pct: number) {
    if (pct >= 70) return 'bg-emerald-500';
    if (pct >= 40) return 'bg-blue-500';
    return 'bg-blue-600';
  }

  // Single objective selected mode
  if (!expandAll) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-gray-700">OKR Module</h2>
              {isAdmin && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-full text-[10px] font-bold text-blue-600 shadow-sm animate-pulse">
                  <div className="w-1 h-1 rounded-full bg-blue-600" />
                  CHẾ ĐỘ CHỈNH SỬA
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Create Dropdown */}
              {isAdmin && (
                <div className="relative group/create">
                  <CreateDropdown onSelect={handleCreate} />
                </div>
              )}

              {isAdmin && (
                <button
                  onClick={() => setExpandAll(true)}
                  className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  title="Mở rộng tất cả"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="currentColor">
                    <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                    <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                    <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                    <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Overall progress */}
          <div className="mb-6">
            <div className="flex items-end gap-3">
              <div className="text-5xl font-bold text-gray-900 tracking-tight">
                {avgPct}
                <span className="text-3xl">%</span>
              </div>
              <div className="mb-2 text-xs text-gray-400">
                trung bình {stats.objectivesWithChildren.length} objectives
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">Tiến độ trung bình toàn bộ OKR</p>
          </div>

          {/* Overall progress bar */}
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-8">
            <div
              className={`h-full rounded-full transition-all duration-700 ${getAvgProgressBarColor(avgPct)}`}
              style={{ width: `${Math.min(avgPct, 100)}%` }}
            />
          </div>

          {/* Objective cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-2">
            {stats.objectivesWithChildren.map((obj, i) => (
              <ObjectiveCard
                key={obj.id}
                objective={obj}
                isSelected={obj.id === selectedId}
                // UX 2: always select, never deselect on click
                onClick={() => setSelectedId(obj.id)}
                colorIndex={i}
              />
            ))}
          </div>
        </div>

        {/* Expand/collapse arrow */}
        {selectedObjective && (
          <div className="flex justify-center py-1">
            <ChevronDown size={18} className="text-gray-300" />
          </div>
        )}

        {/* Child list */}
        {selectedObjective && (
          <div className="border-t border-gray-100">
            <ObjectiveChildList children={selectedObjective.children} onItemClick={handleItemClick} />
          </div>
        )}

        {/* Detail drawer */}
        <ItemDetailDrawer
          itemId={drawerItemId}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onAddChild={handleCreateChild}
        />

        {/* Create drawer */}
        <CreateItemDrawer
          open={createDrawerOpen}
          onOpenChange={setCreateDrawerOpen}
          parentId={createParentId}
          parentType={createParentType}
          initialType={createItemType}
          onCreated={() => router.refresh()}
        />
      </div>
    );
  }

  // Expand all mode — all objectives shown with their children
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-gray-700">OKR Tree View</h2>
            {isAdmin && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-full text-[10px] font-bold text-blue-600 shadow-sm animate-pulse">
                <div className="w-1 h-1 rounded-full bg-blue-600" />
                CHẾ ĐỘ CHỈNH SỬA
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Create Dropdown */}
            {isAdmin && (
              <div className="relative group/create-expanded">
                <CreateDropdown onSelect={handleCreate} />
              </div>
            )}

            <button
              onClick={() => setExpandAll(false)}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              title="Thu gọn"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="currentColor">
                <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <line x1="8" y1="4" x2="8" y2="12" stroke="currentColor" strokeWidth="1.5" />
                <line x1="4" y1="8" x2="12" y2="8" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Overall progress */}
        <div className="mb-6">
          <div className="flex items-end gap-3">
            <div className="text-5xl font-bold text-gray-900 tracking-tight">
              {avgPct}
              <span className="text-3xl">%</span>
            </div>
            <div className="mb-2 text-xs text-gray-400">
              trung bình {stats.objectivesWithChildren.length} objectives
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">Tiến độ trung bình toàn bộ OKR</p>
        </div>

        {/* Overall progress bar */}
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-6">
          <div
            className={`h-full rounded-full transition-all duration-700 ${getAvgProgressBarColor(avgPct)}`}
            style={{ width: `${Math.min(avgPct, 100)}%` }}
          />
        </div>
      </div>

      {/* All objectives expanded */}
      <div className="divide-y divide-gray-100">
        {stats.objectivesWithChildren.map((obj, i) => {
          const CARD_COLORS = [
            'border-l-orange-400',
            'border-l-teal-400',
            'border-l-rose-400',
            'border-l-blue-400',
            'border-l-purple-400',
            'border-l-amber-400',
          ];
          const progressColor =
            obj.progressPct >= 70
              ? 'text-emerald-500'
              : obj.progressPct >= 30
                ? 'text-orange-500'
                : 'text-rose-400';
          const barColor =
            obj.progressPct >= 70
              ? 'bg-emerald-500'
              : obj.progressPct >= 30
                ? 'bg-orange-400'
                : 'bg-rose-400';

          return (
            <div key={obj.id} className="flex">
              {/* Left: Objective summary */}
              <div
                className={`w-64 shrink-0 p-6 border-l-4 ${CARD_COLORS[i % CARD_COLORS.length]}`}
              >
                <h3 className="text-xs font-semibold text-gray-700 leading-snug mb-3 line-clamp-3">
                  {obj.title}
                </h3>
                <div className={`text-2xl font-bold ${progressColor}`}>
                  {obj.progressPct}
                  <span className="text-base ml-0.5">%</span>
                </div>
                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mt-2 mb-2">
                  <div
                    className={`h-full rounded-full ${barColor}`}
                    style={{ width: `${Math.min(obj.progressPct, 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400">{obj.status}</span>
              </div>

              {/* Right: Children */}
              <div className="flex-1 min-w-0">
                <ObjectiveChildList children={obj.children} onItemClick={handleItemClick} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail drawer */}
      <ItemDetailDrawer
        itemId={drawerItemId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onAddChild={handleCreateChild}
      />

      {/* Create drawer */}
      <CreateItemDrawer
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
        parentId={createParentId}
        parentType={createParentType}
        initialType={createItemType}
        onCreated={() => router.refresh()}
      />
    </div>
  );
}
