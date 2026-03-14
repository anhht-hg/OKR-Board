'use client';

import { useState } from 'react';
import { Plus, Trash2, ClipboardList, CheckCircle2, ArrowRightCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActionPlans, useDeleteActionPlan, useClosePlan } from '@/hooks/useActionPlan';
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
  const closePlan = useClosePlan();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [closeResult, setCloseResult] = useState<{ rolledOver: number } | null>(null);

  // Auto-select first plan when loaded
  const activePlanId = selectedPlanId ?? (plans[0]?.id ?? null);
  const activePlan = plans.find(p => p.id === activePlanId) ?? null;

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

  async function handleClose(planId: string) {
    if (!confirm(
      'Kết thúc tháng này?\n\nTất cả công việc chưa hoàn thành sẽ được chuyển sang tháng tiếp theo.\nKế hoạch tháng hiện tại sẽ được đánh dấu "Đã kết thúc".'
    )) return;
    setClosing(true);
    setCloseResult(null);
    try {
      const result = await closePlan.mutateAsync(planId);
      setCloseResult({ rolledOver: result.rolledOver });
      setSelectedPlanId(result.nextPlanId);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Lỗi kết thúc tháng');
    } finally {
      setClosing(false);
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
            <div className="flex items-center gap-2">
              {activePlan && !activePlan.closedAt && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleClose(activePlan.id)}
                  disabled={closing}
                  className="gap-1.5 border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                >
                  <ArrowRightCircle size={14} />
                  {closing ? 'Đang xử lý...' : 'Kết thúc tháng'}
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => setCreateOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
              >
                <Plus size={14} />
                Tạo kế hoạch
              </Button>
            </div>
          )}
        </div>

        {/* Month pills */}
        {!isLoading && plans.length > 0 && (
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
            {plans.map(plan => {
              const isActive = plan.id === activePlanId;
              const isClosed = !!plan.closedAt;
              return (
                <div key={plan.id} className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : isClosed
                        ? 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {isClosed && <CheckCircle2 size={10} className={isActive ? 'text-indigo-200' : 'text-gray-400'} />}
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
        {closeResult && (
          <div className="mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            <span>
              <strong>Đã kết thúc tháng.</strong>{' '}
              {closeResult.rolledOver > 0
                ? `${closeResult.rolledOver} công việc chưa hoàn thành đã được chuyển sang tháng tiếp theo.`
                : 'Tất cả công việc đã hoàn thành — không có gì cần chuyển.'}
            </span>
            <button onClick={() => setCloseResult(null)} className="text-emerald-500 hover:text-emerald-700 font-bold text-base leading-none">×</button>
          </div>
        )}
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
