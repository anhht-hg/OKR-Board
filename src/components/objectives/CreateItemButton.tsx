'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Target, Layers, Calculator, Briefcase, Users, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CreateItemDrawer } from '@/components/dashboard/CreateItemDrawer';
import { useAuth } from '@/context/AuthContext';

const CREATE_TYPES = [
  { value: 'Objective',      label: 'Mục tiêu',              bg: 'bg-blue-100',   text: 'text-blue-600',   icon: Target },
  { value: 'SuccessFactor',  label: 'Yếu tố thành công',     bg: 'bg-teal-100',   text: 'text-teal-600',   icon: Layers },
  { value: 'KeyResult',      label: 'Kết quả then chốt',     bg: 'bg-slate-100',  text: 'text-slate-600',  icon: Calculator },
  { value: 'Feature',        label: 'Tính năng',             bg: 'bg-pink-100',   text: 'text-pink-600',   icon: Briefcase },
  { value: 'UserCapability', label: 'Năng lực người dùng',   bg: 'bg-purple-100', text: 'text-purple-600', icon: Users },
  { value: 'Adoption',       label: 'Mức độ tiếp nhận',      bg: 'bg-green-100',  text: 'text-green-600',  icon: TrendingUp },
  { value: 'Impact',         label: 'Tác động',              bg: 'bg-rose-100',   text: 'text-rose-600',   icon: Zap },
];

export function CreateItemButton() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createType, setCreateType] = useState('Objective');

  if (!isAdmin) return null;

  function handleSelect(type: string) {
    setCreateType(type);
    setPopoverOpen(false);
    setDrawerOpen(true);
  }

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-[11px] font-bold uppercase tracking-tight border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Tạo mới
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={4} className="w-52 p-1">
          {CREATE_TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                onClick={() => handleSelect(t.value)}
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

      <CreateItemDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        initialType={createType}
        onCreated={() => router.refresh()}
      />
    </>
  );
}
