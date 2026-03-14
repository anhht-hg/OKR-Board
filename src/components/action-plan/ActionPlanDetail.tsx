'use client';

import { Fragment, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Pencil, Check, X, CheckCircle2 } from 'lucide-react';
import { useActionPlan, useCreateGoal, useUpdateGoal, useDeleteGoal, useCreateActionItem, useUpdateActionItem, useDeleteActionItem } from '@/hooks/useActionPlan';
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

// ─── Row style by status ─────────────────────────────────────────────────────

const ROW_STATUS_STYLE: Record<string, { border: string; bg: string }> = {
  'Hoàn thành':      { border: 'border-l-2 border-l-emerald-400', bg: 'bg-emerald-50/40' },
  'Đang làm':        { border: 'border-l-2 border-l-orange-400',  bg: 'bg-orange-50/40'  },
  'Chưa triển khai': { border: 'border-l-2 border-l-transparent', bg: ''                 },
};

// ─── Status selector ─────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  'Chưa triển khai': 'bg-gray-100 text-gray-500 border border-gray-200',
  'Đang làm':        'bg-orange-100 text-orange-700 border border-orange-200',
  'Hoàn thành':      'bg-emerald-100 text-emerald-700 border border-emerald-200',
};

function StatusCell({ status, onSave }: { status: string; onSave: (s: string) => void }) {
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const badgeCls = STATUS_BADGE[status] ?? STATUS_BADGE['Chưa triển khai'];
  const dot = ACTION_STATUS_COLORS[status]?.dot ?? 'bg-gray-400';

  // Close on click outside both button and dropdown
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        btnRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!isAdmin) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${badgeCls}`}>
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
        {status}
      </span>
    );
  }

  function handleOpen() {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    setOpen(o => !o);
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${badgeCls} hover:opacity-80 transition-opacity`}
        onClick={handleOpen}
      >
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
        {status}
      </button>
      {open && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden min-w-[150px]"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          {ACTION_ITEM_STATUSES.map(st => {
            const sc = ACTION_STATUS_COLORS[st];
            return (
              <button
                key={st}
                className="w-full text-left text-xs px-3 py-2.5 hover:bg-gray-50 flex items-center gap-2.5"
                onClick={() => { onSave(st); setOpen(false); }}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />
                {st}
              </button>
            );
          })}
        </div>,
        document.body
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

  const isDone = item.status === 'Hoàn thành';
  const rowStyle = ROW_STATUS_STYLE[item.status] ?? ROW_STATUS_STYLE['Chưa triển khai'];
  const fadedText = isDone ? 'text-gray-400 line-through' : '';

  function save(field: string, value: string) {
    updateItem.mutate({ itemId: item.id, data: { [field]: value } });
  }

  return (
    <tr className={`group border-b border-gray-100 last:border-0 transition-colors hover:brightness-95 ${rowStyle.border} ${rowStyle.bg}`}>
      <td className="px-3 py-2.5 text-xs text-gray-400 w-8 text-center">{index}</td>
      <td className="px-3 py-2.5 text-xs max-w-[200px]">
        <EditableCell
          value={item.task}
          onSave={v => save('task', v)}
          placeholder="Công việc..."
          className={`text-xs font-medium ${isDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}
        />
      </td>
      <td className="px-3 py-2.5 text-xs max-w-[180px]">
        <EditableCell value={item.expectedResult ?? ''} onSave={v => save('expectedResult', v)} placeholder="Kết quả mong đợi..." className={`text-xs ${isDone ? 'text-gray-300' : 'text-gray-600'}`} />
      </td>
      <td className="px-3 py-2.5 text-xs w-28">
        <EditableCell value={item.pic ?? ''} onSave={v => save('pic', v)} placeholder="Người phụ trách" className={`text-xs font-medium ${isDone ? 'text-gray-400' : 'text-gray-700'}`} />
      </td>
      <td className="px-3 py-2.5 text-xs w-24">
        <EditableCell
          value={item.startDate ? item.startDate.slice(0, 10) : ''}
          onSave={v => save('startDate', v)}
          type="date"
          placeholder="—"
          className={`text-xs tabular-nums ${isDone ? 'text-gray-300' : 'text-gray-500'}`}
        />
      </td>
      <td className="px-3 py-2.5 text-xs w-24">
        <EditableCell
          value={item.endDate ? item.endDate.slice(0, 10) : ''}
          onSave={v => save('endDate', v)}
          type="date"
          placeholder="—"
          className={`text-xs tabular-nums ${isDone ? 'text-gray-300' : 'text-gray-500'}`}
        />
      </td>
      <td className="px-3 py-2.5 w-36">
        <StatusCell status={item.status} onSave={v => save('status', v)} />
      </td>
      <td className="px-3 py-2.5 text-xs w-28">
        <EditableCell value={item.budget ?? ''} onSave={v => save('budget', v)} placeholder="Ngân sách..." className={`text-xs ${isDone ? 'text-gray-300' : 'text-gray-500'}`} />
      </td>
      <td className="px-3 py-2.5 text-xs w-28">
        <EditableCell value={item.okrLinkage ?? ''} onSave={v => save('okrLinkage', v)} placeholder="O1 - KR 1" className={`text-xs ${isDone ? 'text-gray-400' : 'text-blue-600'}`} />
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

const GOALS_VISIBLE_DEFAULT = 3;

export function ActionPlanDetail({ planId }: Props) {
  const { data: plan, isLoading } = useActionPlan(planId);
  const { isAdmin } = useAuth();
  const createGoal = useCreateGoal(planId);
  const createItem = useCreateActionItem(planId);
  const [showAllGoals, setShowAllGoals] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!plan) return null;

  const isClosed = !!plan.closedAt;

  // Stats
  const allItems = plan.goals.flatMap(g => g.actionItems);
  const done = allItems.filter(i => i.status === 'Hoàn thành').length;
  const inProgress = allItems.filter(i => i.status === 'Đang làm').length;
  const notStarted = allItems.filter(i => i.status === 'Chưa triển khai').length;
  const total = allItems.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Closed banner */}
      {isClosed && (
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
          <div>
            <span className="text-sm font-semibold">Tháng này đã kết thúc</span>
            <span className="text-xs text-emerald-600 ml-2">
              — Kết thúc lúc {new Date(plan.closedAt!).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      )}

      {/* Header stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tổng công việc', value: total,      color: 'text-gray-800',    bar: 'bg-gray-300',     accent: 'border-l-gray-300'    },
          { label: 'Chưa triển khai', value: notStarted, color: 'text-gray-500',   bar: 'bg-gray-300',     accent: 'border-l-gray-300'    },
          { label: 'Đang làm',        value: inProgress, color: 'text-orange-600', bar: 'bg-orange-400',   accent: 'border-l-orange-400'  },
          { label: 'Hoàn thành',      value: done,       color: 'text-emerald-600',bar: 'bg-emerald-400',  accent: 'border-l-emerald-400' },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-xl border border-gray-100 border-l-4 ${s.accent} shadow-sm p-4`}>
            <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Tiến độ tổng thể</span>
          <span className="text-sm font-bold text-emerald-600">{pct}%</span>
        </div>
        {/* Stacked bar: done (green) + in-progress (orange) + rest (gray) */}
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
          <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
          <div className="h-full bg-orange-300 transition-all duration-500" style={{ width: `${total > 0 ? (inProgress / total) * 100 : 0}%` }} />
        </div>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-xs text-gray-400">{done} / {total} hoàn thành</span>
          {inProgress > 0 && <span className="text-xs text-orange-500 font-medium">{inProgress} đang làm</span>}
          {notStarted > 0 && <span className="text-xs text-gray-400">{notStarted} chưa bắt đầu</span>}
        </div>
      </div>

      {/* ── Section A: Monthly Focus Objectives ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-800">A. Mục tiêu trọng tâm tháng</h3>
            <p className="text-xs text-gray-400 mt-0.5">3 – 5 mục tiêu định hướng hành động trong tháng</p>
          </div>
          {isAdmin && !isClosed && (
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
          {(showAllGoals ? plan.goals : plan.goals.slice(0, GOALS_VISIBLE_DEFAULT)).map((goal, i) => (
            <GoalSection key={goal.id} goal={goal} planId={planId} goalIndex={i} />
          ))}
          {plan.goals.length > GOALS_VISIBLE_DEFAULT && (
            <button
              onClick={() => setShowAllGoals(v => !v)}
              className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors rounded-lg hover:bg-blue-50"
            >
              {showAllGoals
                ? `Ẩn bớt`
                : `Xem thêm ${plan.goals.length - GOALS_VISIBLE_DEFAULT} mục tiêu`}
              <svg className={`w-3.5 h-3.5 transition-transform ${showAllGoals ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
          )}
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
                {plan.goals.map((goal) => {
                  const goalDone = goal.actionItems.filter(i => i.status === 'Hoàn thành').length;
                  const goalInProgress = goal.actionItems.filter(i => i.status === 'Đang làm').length;
                  const goalTotal = goal.actionItems.length;
                  const goalPct = goalTotal > 0 ? Math.round((goalDone / goalTotal) * 100) : 0;

                  return (
                  <Fragment key={goal.id}>
                    {/* Goal sub-header row */}
                    <tr className="bg-indigo-50 border-t-2 border-t-indigo-100">
                      <td colSpan={isAdmin ? 10 : 9} className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-4 rounded-full bg-indigo-400 flex-shrink-0" />
                          <span className="text-xs font-bold text-indigo-800">{goal.title}</span>
                          {goal.okrLinkage && (
                            <span className="text-[10px] bg-indigo-100 text-indigo-500 px-2 py-0.5 rounded-full font-medium">{goal.okrLinkage}</span>
                          )}
                          <div className="ml-auto flex items-center gap-2">
                            {goalTotal > 0 && (
                              <>
                                <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-medium">
                                  <span className="text-emerald-600 font-bold">{goalDone}</span>
                                  {goalInProgress > 0 && <span className="text-orange-500 font-bold">/ {goalInProgress} đang làm</span>}
                                  <span>/ {goalTotal}</span>
                                </div>
                                <div className="w-20 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                                    style={{ width: `${goalPct}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-indigo-500">{goalPct}%</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                    {/* Action item rows */}
                    {goal.actionItems.map((item, idx) => (
                      <ActionItemRow key={item.id} item={item} planId={planId} index={idx + 1} />
                    ))}
                    {/* Add row button */}
                    {isAdmin && !isClosed && (
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
