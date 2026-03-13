'use client';

import { useState } from 'react';
import { Plus, Trash2, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActionPlans, useDeleteActionPlan } from '@/hooks/useActionPlan';
import { useAuth } from '@/context/AuthContext';
import { CreatePlanDialog } from './CreatePlanDialog';
import { ActionPlanDetail } from './ActionPlanDetail';

const MONTH_NAMES = [
  '', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
  'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

export function ActionPlanPage() {
  const { isAdmin } = useAuth();
  const { data: plans = [], isLoading } = useActionPlans();
  const deletePlan = useDeleteActionPlan();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Auto-select first plan when loaded
  const activePlanId = selectedPlanId ?? (plans[0]?.id ?? null);

  async function handleDelete(planId: string) {
    if (!confirm('Xoá kế hoạch này và toàn bộ dữ liệu bên trong?')) return;
    setDeletingId(planId);
    try {
      await deletePlan.mutateAsync(planId);
      if (activePlanId === planId) setSelectedPlanId(null);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
              <ClipboardList size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Kế hoạch hành động</h1>
              <p className="text-xs text-gray-500">Theo dõi công việc hàng tháng</p>
            </div>
          </div>
          {isAdmin && (
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
            >
              <Plus size={14} />
              Tạo kế hoạch
            </Button>
          )}
        </div>

        {/* Month pills */}
        {!isLoading && plans.length > 0 && (
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
            {plans.map(plan => {
              const isActive = plan.id === activePlanId;
              return (
                <div key={plan.id} className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {MONTH_NAMES[plan.month]}/{plan.year}
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(plan.id)}
                      disabled={deletingId === plan.id}
                      className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="Xoá kế hoạch"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
            Đang tải...
          </div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
              <ClipboardList size={28} className="text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">Chưa có kế hoạch nào</p>
              <p className="text-xs text-gray-400 mt-1">Tạo kế hoạch hành động cho tháng này</p>
            </div>
            {isAdmin && (
              <Button
                size="sm"
                onClick={() => setCreateOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
              >
                <Plus size={14} />
                Tạo kế hoạch đầu tiên
              </Button>
            )}
          </div>
        ) : activePlanId ? (
          <ActionPlanDetail planId={activePlanId} />
        ) : null}
      </div>

      <CreatePlanDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => setSelectedPlanId(id)}
      />
    </div>
  );
}
