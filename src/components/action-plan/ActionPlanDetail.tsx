'use client';

import { Fragment, useState } from 'react';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { useActionPlan, useCreateGoal, useUpdateGoal, useDeleteGoal, useCreateActionItem, useUpdateActionItem, useDeleteActionItem, useCreateKpi, useUpdateKpi, useDeleteKpi } from '@/hooks/useActionPlan';
import { ACTION_STATUS_COLORS, ACTION_ITEM_STATUSES } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';
import { ActionItem, MonthlyGoal } from '@/types';

interface Props { planId: string }

// ─── Inline editable cell ────────────────────────────────────────────────────

function EditableCell({
  value,
  onSave,
  placeholder,
  type = 'text',
  className = '',
}: {
  value: string;
  onSave: (val: string) => void;
  placeholder?: string;
  type?: 'text' | 'date';
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <span className={className}>{value || <span className="text-gray-300">—</span>}</span>;
  }

  if (editing) {
    return (
      <input
        type={type}
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => { setEditing(false); if (draft !== value) onSave(draft); }}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.currentTarget.blur(); }
          if (e.key === 'Escape') { setDraft(value); setEditing(false); }
        }}
        className="w-full text-xs border border-blue-300 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-blue-400 bg-white"
        placeholder={placeholder}
      />
    );
  }

  return (
    <span
      className={`cursor-pointer hover:bg-blue-50 rounded px-1 -mx-1 transition-colors ${className}`}
      onClick={() => { setDraft(value); setEditing(true); }}
      title="Click để chỉnh sửa"
    >
      {value || <span className="text-gray-300 text-xs italic">{placeholder ?? '—'}</span>}
    </span>
  );
}

// ─── Status selector ─────────────────────────────────────────────────────────

function StatusCell({ status, onSave }: { status: string; onSave: (s: string) => void }) {
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const s = ACTION_STATUS_COLORS[status] ?? ACTION_STATUS_COLORS['Chưa triển khai'];

  if (!isAdmin) {
    return (
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
        {status}
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.bg} ${s.text} cursor-pointer hover:opacity-80 transition-opacity`}
        onClick={() => setOpen(o => !o)}
      >
        {status}
      </button>
      {open && (
        <div className="absolute z-10 top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-[140px]">
          {ACTION_ITEM_STATUSES.map(st => {
            const sc = ACTION_STATUS_COLORS[st];
            return (
              <button
                key={st}
                className="w-full text-left text-xs px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
                onClick={() => { onSave(st); setOpen(false); }}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />
                {st}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Section A: Monthly Goals ─────────────────────────────────────────────────

function GoalSection({ goal, planId, goalIndex }: { goal: MonthlyGoal; planId: string; goalIndex: number }) {
  const { isAdmin } = useAuth();
  const updateGoal = useUpdateGoal(planId);
  const deleteGoal = useDeleteGoal(planId);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState(goal.title);
  const [goalOkr, setGoalOkr] = useState(goal.okrLinkage ?? '');
  const [goalResult, setGoalResult] = useState(goal.expectedResult ?? '');

  return (
    <div className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-colors group">
      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {goalIndex + 1}
      </div>
      <div className="flex-1 min-w-0">
        {editingGoal ? (
          <div className="space-y-2">
            <input
              autoFocus
              value={goalTitle}
              onChange={e => setGoalTitle(e.target.value)}
              className="w-full text-sm font-semibold border border-blue-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="Mục tiêu trọng tâm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={goalOkr}
                onChange={e => setGoalOkr(e.target.value)}
                className="text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-300"
                placeholder="Liên kết OKR (vd: O1, O2...)"
              />
              <input
                value={goalResult}
                onChange={e => setGoalResult(e.target.value)}
                className="text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-300"
                placeholder="Kết quả cần đạt"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={async () => {
                  await updateGoal.mutateAsync({ goalId: goal.id, data: { title: goalTitle, okrLinkage: goalOkr, expectedResult: goalResult } });
                  setEditingGoal(false);
                }}
                className="text-[11px] font-semibold px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                <Check size={11} className="inline mr-1" />Lưu
              </button>
              <button onClick={() => setEditingGoal(false)} className="text-[11px] font-semibold px-3 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
                <X size={11} className="inline mr-1" />Huỷ
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-gray-800 leading-snug">{goal.title}</p>
            {(goal.okrLinkage || goal.expectedResult) && (
              <div className="flex flex-wrap gap-3 mt-1.5">
                {goal.okrLinkage && (
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{goal.okrLinkage}</span>
                )}
                {goal.expectedResult && (
                  <span className="text-xs text-gray-500 italic leading-snug">{goal.expectedResult}</span>
                )}
              </div>
            )}
          </>
        )}
      </div>
      {isAdmin && !editingGoal && (
        <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditingGoal(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            title="Chỉnh sửa"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => {
              if (!confirm(`Xóa mục tiêu "${goal.title}"?\nTất cả công việc liên kết sẽ bị xóa.`)) return;
              deleteGoal.mutate(goal.id);
            }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
            title="Xóa"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Section B: Action items table ───────────────────────────────────────────

function ActionItemRow({ item, planId, index }: { item: ActionItem; planId: string; index: number }) {
  const { isAdmin } = useAuth();
  const updateItem = useUpdateActionItem(planId);
  const deleteItem = useDeleteActionItem(planId);

  function save(field: string, value: string) {
    updateItem.mutate({ itemId: item.id, data: { [field]: value } });
  }

  return (
    <tr className="group hover:bg-gray-50 border-b border-gray-100 last:border-0">
      <td className="px-3 py-2.5 text-xs text-gray-400 w-8 text-center">{index}</td>
      <td className="px-3 py-2.5 text-xs max-w-[200px]">
        <EditableCell value={item.task} onSave={v => save('task', v)} placeholder="Công việc..." className="text-xs text-gray-800 font-medium" />
      </td>
      <td className="px-3 py-2.5 text-xs max-w-[180px]">
        <EditableCell value={item.expectedResult ?? ''} onSave={v => save('expectedResult', v)} placeholder="Kết quả mong đợi..." className="text-xs text-gray-600" />
      </td>
      <td className="px-3 py-2.5 text-xs w-28">
        <EditableCell value={item.pic ?? ''} onSave={v => save('pic', v)} placeholder="Người phụ trách" className="text-xs text-gray-700 font-medium" />
      </td>
      <td className="px-3 py-2.5 text-xs w-24">
        <EditableCell
          value={item.startDate ? item.startDate.slice(0, 10) : ''}
          onSave={v => save('startDate', v)}
          type="date"
          placeholder="—"
          className="text-xs text-gray-500 tabular-nums"
        />
      </td>
      <td className="px-3 py-2.5 text-xs w-24">
        <EditableCell
          value={item.endDate ? item.endDate.slice(0, 10) : ''}
          onSave={v => save('endDate', v)}
          type="date"
          placeholder="—"
          className="text-xs text-gray-500 tabular-nums"
        />
      </td>
      <td className="px-3 py-2.5 w-32">
        <StatusCell status={item.status} onSave={v => save('status', v)} />
      </td>
      <td className="px-3 py-2.5 text-xs w-28">
        <EditableCell value={item.budget ?? ''} onSave={v => save('budget', v)} placeholder="Ngân sách..." className="text-xs text-gray-500" />
      </td>
      <td className="px-3 py-2.5 text-xs w-28">
        <EditableCell value={item.okrLinkage ?? ''} onSave={v => save('okrLinkage', v)} placeholder="O1 - KR 1" className="text-xs text-blue-600" />
      </td>
      {isAdmin && (
        <td className="px-2 py-2.5 w-10">
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500"
            onClick={() => {
              if (!confirm(`Xóa công việc "${item.task}"?`)) return;
              deleteItem.mutate(item.id);
            }}
          >
            <Trash2 size={12} />
          </button>
        </td>
      )}
    </tr>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ActionPlanDetail({ planId }: Props) {
  const { data: plan, isLoading } = useActionPlan(planId);
  const { isAdmin } = useAuth();
  const createGoal = useCreateGoal(planId);
  const createItem = useCreateActionItem(planId);
  const createKpi = useCreateKpi(planId);
  const updateKpi = useUpdateKpi(planId);
  const deleteKpi = useDeleteKpi(planId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!plan) return null;

  // Stats
  const allItems = plan.goals.flatMap(g => g.actionItems);
  const done = allItems.filter(i => i.status === 'Hoàn thành').length;
  const inProgress = allItems.filter(i => i.status === 'Đang làm').length;
  const notStarted = allItems.filter(i => i.status === 'Chưa triển khai').length;
  const total = allItems.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tổng công việc', value: total, color: 'text-gray-800' },
          { label: 'Chưa triển khai', value: notStarted, color: 'text-gray-500' },
          { label: 'Đang làm', value: inProgress, color: 'text-orange-600' },
          { label: 'Hoàn thành', value: done, color: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Tiến độ tổng thể</span>
          <span className="text-sm font-bold text-blue-600">{pct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">{done} / {total} công việc hoàn thành</p>
      </div>

      {/* ── Section A: Monthly Focus Objectives ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-800">A. Mục tiêu trọng tâm tháng</h3>
            <p className="text-xs text-gray-400 mt-0.5">3 – 5 mục tiêu định hướng hành động trong tháng</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => createGoal.mutate({ title: 'Mục tiêu mới' })}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              <Plus size={13} /> Thêm mục tiêu
            </button>
          )}
        </div>
        <div className="p-4 grid gap-3">
          {plan.goals.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">Chưa có mục tiêu trọng tâm. {isAdmin && 'Nhấn "Thêm mục tiêu" để bắt đầu.'}</p>
          )}
          {plan.goals.map((goal, i) => (
            <GoalSection key={goal.id} goal={goal} planId={planId} goalIndex={i} />
          ))}
        </div>
      </div>

      {/* ── Section B: Action Plan Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">B. Kế hoạch hành động tháng</h3>
          <p className="text-xs text-gray-400 mt-0.5">Danh sách công việc cụ thể theo từng mục tiêu trọng tâm</p>
        </div>

        {plan.goals.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Tạo mục tiêu trọng tâm trước để thêm công việc.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide w-8">#</th>
                  <th className="px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Nhiệm vụ / Công việc</th>
                  <th className="px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Kết quả mong đợi</th>
                  <th className="px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide w-28">PiC</th>
                  <th className="px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide w-24">Bắt đầu</th>
                  <th className="px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide w-24">Deadline</th>
                  <th className="px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide w-32">Trạng thái</th>
                  <th className="px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide w-28">Ngân sách</th>
                  <th className="px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide w-28">Liên kết KR</th>
                  {isAdmin && <th className="w-10" />}
                </tr>
              </thead>
              <tbody>
                {plan.goals.map((goal) => (
                  <Fragment key={goal.id}>
                    {/* Goal sub-header row */}
                    <tr className="bg-blue-50/60">
                      <td colSpan={isAdmin ? 10 : 9} className="px-4 py-2">
                        <span className="text-[11px] font-bold text-blue-700">{goal.title}</span>
                        {goal.okrLinkage && (
                          <span className="ml-2 text-[10px] text-blue-400">({goal.okrLinkage})</span>
                        )}
                      </td>
                    </tr>
                    {/* Action item rows */}
                    {goal.actionItems.map((item, idx) => (
                      <ActionItemRow key={item.id} item={item} planId={planId} index={idx + 1} />
                    ))}
                    {/* Add row button */}
                    {isAdmin && (
                      <tr className="border-b border-gray-100">
                        <td colSpan={isAdmin ? 10 : 9} className="px-4 py-1.5">
                          <button
                            onClick={() => createItem.mutate({ goalId: goal.id, data: {} })}
                            className="text-[11px] font-semibold text-blue-500 hover:text-blue-700 flex items-center gap-1 transition-colors"
                          >
                            <Plus size={11} /> Thêm công việc
                          </button>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Section C: KPI Tracking ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-800">C. Theo dõi tiến độ KPI</h3>
            <p className="text-xs text-gray-400 mt-0.5">Các chỉ số và mục tiêu cần đạt trong tháng</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => createKpi.mutate({ metric: 'Chỉ số mới' })}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              <Plus size={13} /> Thêm chỉ số
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide w-8">#</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Chỉ số</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide w-32">Mục tiêu</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide w-32">Thực tế</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide w-20">%</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Ghi chú</th>
                {isAdmin && <th className="w-10" />}
              </tr>
            </thead>
            <tbody>
              {plan.kpis.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-4 py-8 text-sm text-gray-400 text-center">
                    Chưa có chỉ số KPI. {isAdmin && 'Nhấn "Thêm chỉ số" để bắt đầu.'}
                  </td>
                </tr>
              )}
              {plan.kpis.map((kpi, idx) => {
                const pctKpi = (() => {
                  const t = parseFloat(kpi.target ?? '');
                  const a = parseFloat(kpi.actual ?? '');
                  if (isNaN(t) || isNaN(a) || t === 0) return null;
                  return Math.round((a / t) * 100);
                })();

                return (
                  <tr key={kpi.id} className="group border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-xs text-gray-400 text-center">{idx + 1}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <EditableCell value={kpi.metric} onSave={v => updateKpi.mutate({ kpiId: kpi.id, data: { metric: v } })} className="text-xs text-gray-800 font-medium" />
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <EditableCell value={kpi.target ?? ''} onSave={v => updateKpi.mutate({ kpiId: kpi.id, data: { target: v } })} placeholder="Mục tiêu" className="text-xs text-gray-600 tabular-nums" />
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <EditableCell value={kpi.actual ?? ''} onSave={v => updateKpi.mutate({ kpiId: kpi.id, data: { actual: v } })} placeholder="Thực tế" className="text-xs text-gray-600 tabular-nums" />
                    </td>
                    <td className="px-4 py-2.5 text-xs w-20">
                      {pctKpi !== null ? (
                        <span className={`text-xs font-bold tabular-nums ${pctKpi >= 100 ? 'text-emerald-600' : pctKpi >= 70 ? 'text-orange-500' : 'text-red-500'}`}>
                          {pctKpi}%
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <EditableCell value={kpi.note ?? ''} onSave={v => updateKpi.mutate({ kpiId: kpi.id, data: { note: v } })} placeholder="Ghi chú..." className="text-xs text-gray-500" />
                    </td>
                    {isAdmin && (
                      <td className="px-2 py-2.5 w-10">
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500"
                          onClick={() => {
                            if (!confirm(`Xóa chỉ số "${kpi.metric}"?`)) return;
                            deleteKpi.mutate(kpi.id);
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
