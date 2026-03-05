'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { OkrItem } from '@/types';
import {
  ChevronRight,
  User,
  Calendar,
  Briefcase,
  Tag,
  Layers,
  Users,
  Flag,
  FileText,
  Target,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TYPE_COLORS as TYPE_COLORS_RAW, TYPE_LABELS } from '@/lib/constants';
import { CreateItemDrawer } from './CreateItemDrawer';
import { isOverdue } from '@/lib/dateUtils';
import { nextStatus } from '@/lib/statusUtils';
import { useAuth } from '@/context/AuthContext';

interface Props {
  itemId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddChild?: (parentId: string, parentType: string) => void;
}

interface Ancestor {
  id: string;
  code: string | null;
  title: string;
  type: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  'Chưa bắt đầu': { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', label: 'Chưa bắt đầu' },
  'Đang triển khai': { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-400', label: 'Đang triển khai' },
  'Hoàn thành': { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Hoàn thành' },
};

// Adapter: split combined TYPE_COLORS strings into {bg, text} pairs
const TYPE_STYLES: Record<string, { bg: string; text: string }> = Object.fromEntries(
  Object.entries(TYPE_COLORS_RAW).map(([k, v]) => {
    const [bg, text] = v.split(' ');
    return [k, { bg, text }];
  })
);

const PROJECT_COLORS: Record<string, { bg: string; text: string }> = {
  'HG Stock': { bg: 'bg-red-100', text: 'text-red-700' },
  'QL Kênh': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'Tài chính': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'Quản lý NS': { bg: 'bg-purple-100', text: 'text-purple-700' },
  'Dữ liệu & Báo cáo': { bg: 'bg-amber-100', text: 'text-amber-700' },
};

const STATUS_DOT: Record<string, string> = {
  'Hoàn thành': 'bg-emerald-500',
  'Đang triển khai': 'bg-orange-400',
  'Chưa bắt đầu': 'bg-gray-300',
};

function getProgressColor(pct: number) {
  if (pct >= 70) return 'text-emerald-500';
  if (pct >= 30) return 'text-orange-500';
  return 'text-rose-500';
}

function getProgressBarColor(pct: number) {
  if (pct >= 70) return 'bg-emerald-500';
  if (pct >= 30) return 'bg-orange-400';
  return 'bg-rose-400';
}

const NEXT_TYPE: Record<string, string> = {
  Objective: 'SuccessFactor',
  SuccessFactor: 'KeyResult',
  KeyResult: 'Feature',
  Feature: 'UserCapability',
};

export function ItemDetailDrawer({ itemId, open, onOpenChange, onAddChild }: Props) {
  const { isAdmin } = useAuth();
  const [item, setItem] = useState<OkrItem | null>(null);
  const [ancestors, setAncestors] = useState<Ancestor[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [editingOwner, setEditingOwner] = useState(false);
  const [ownerDraft, setOwnerDraft] = useState('');
  const [editingDates, setEditingDates] = useState(false);
  const [startDateDraft, setStartDateDraft] = useState('');
  const [endDateDraft, setEndDateDraft] = useState('');

  // Internal create-child state
  const [createOpen, setCreateOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [createParentType, setCreateParentType] = useState<string | null>(null);
  const [createParentTitle, setCreateParentTitle] = useState<string | null>(null);
  const [createChildType, setCreateChildType] = useState('Feature');

  const fetchItem = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const [itemRes, ancestorRes] = await Promise.all([
        fetch(`/api/items/${id}`),
        fetch(`/api/items/${id}/ancestors`),
      ]);
      const itemData = await itemRes.json();
      const ancestorData = await ancestorRes.json();
      setItem(itemData);
      setAncestors(ancestorData);
    } catch (err) {
      console.error('Failed to load item:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (itemId && open) {
      fetchItem(itemId);
      setHistory([]);
      setEditingDates(false);
      setEditingOwner(false);
    }
  }, [itemId, open, fetchItem]);

  function navigateToChild(childId: string) {
    if (item) {
      setHistory((prev) => [...prev, item.id]);
    }
    fetchItem(childId);
  }

  function navigateBack() {
    const prev = history[history.length - 1];
    if (prev) {
      setHistory((h) => h.slice(0, -1));
      fetchItem(prev);
    }
  }

  function navigateToBreadcrumb(ancestorId: string) {
    if (item && ancestorId === item.id) return;
    setHistory([]);
    fetchItem(ancestorId);
  }

  function handleAddChild(parentId: string, parentType: string) {
    // If external handler provided (OkrModule), delegate to it
    if (onAddChild) {
      onAddChild(parentId, parentType);
      return;
    }
    // Otherwise handle internally
    const nextType = NEXT_TYPE[parentType];
    if (!nextType) return;
    setCreateParentId(parentId);
    setCreateParentType(parentType);
    // Pass the current item's title so the create drawer shows it without re-fetching
    setCreateParentTitle(item ? (item.code ? `${item.code} · ${item.title}` : item.title) : null);
    setCreateChildType(nextType);
    setCreateOpen(true);
  }

  function handleChildCreated() {
    // Re-fetch current item to show the new child
    if (item) fetchItem(item.id);
  }

  const statusStyle = item ? STATUS_STYLES[item.status] || STATUS_STYLES['Chưa bắt đầu'] : null;
  const typeStyle = item ? TYPE_STYLES[item.type] || { bg: 'bg-gray-500', text: 'text-white' } : null;

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        className="w-full sm:max-w-[42vw] p-0 overflow-y-auto border-l border-gray-200 shadow-2xl"
        side="right"
      >
        {/* Visually hidden title for screen reader accessibility */}
        <SheetTitle className="sr-only">
          {item ? item.title : 'Item detail'}
        </SheetTitle>
        {loading && !item ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : item ? (
          <div className="flex flex-col h-full">
            {/* Top breadcrumb bar */}
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/60 flex items-center gap-2 min-h-[44px]">
              {history.length > 0 && (
                <button
                  onClick={navigateBack}
                  className="text-blue-500 hover:text-blue-700 text-xs font-medium mr-2 cursor-pointer shrink-0"
                >
                  ← Quay lại
                </button>
              )}
              <div className="flex items-center gap-1 flex-wrap text-xs">
                {ancestors.map((anc, i) => {
                  const ancTypeStyle = TYPE_STYLES[anc.type] || { bg: 'bg-gray-500', text: 'text-white' };
                  return (
                    <span key={anc.id} className="flex items-center gap-1">
                      {i > 0 && <ChevronRight size={10} className="text-gray-300 mx-0.5" />}
                      <button
                        onClick={() => navigateToBreadcrumb(anc.id)}
                        className={`transition-colors cursor-pointer flex items-center gap-1 ${
                          anc.id === item.id
                            ? 'text-gray-800 font-semibold'
                            : 'text-gray-400 hover:text-blue-600 hover:underline'
                        }`}
                      >
                        <span
                          className={`text-[8px] font-bold px-1 py-0.5 rounded ${ancTypeStyle.bg} ${ancTypeStyle.text}`}
                        >
                          {anc.type === 'SuccessFactor' ? 'SF' : anc.type.substring(0, 3).toUpperCase()}
                        </span>
                        {anc.code ? `${anc.code} · ${anc.title.substring(0, 20)}` : anc.title.substring(0, 30)}
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Main content + sidebar */}
            <div className="flex flex-1 min-h-0">
              {/* Left: Main content */}
              <div className="flex-1 min-w-0 p-6 overflow-y-auto">
                <SheetHeader className="mb-5">
                  {/* Code badge */}
                  {item.code && typeStyle && (
                    <span
                      className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-md w-fit ${typeStyle.bg} ${typeStyle.text}`}
                    >
                      {item.code}
                    </span>
                  )}
                  <SheetTitle className="text-xl font-bold text-gray-900 leading-snug mt-2">
                    {item.title}
                  </SheetTitle>
                  {item.description && (
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">{item.description}</p>
                  )}
                </SheetHeader>

                {/* Progress section */}
                <div className="mb-6 bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Progress
                    </h4>
                    <span className={`text-lg font-bold ${getProgressColor(item.progressPct)}`}>
                      {Math.round(item.progressPct)}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${getProgressBarColor(item.progressPct)}`}
                      style={{ width: `${Math.min(item.progressPct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Metric cards (for KRs) */}
                {(item.targetValue || item.successMetric || item.measureFormula) && (
                  <div className="mb-6 grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {item.successMetric && (
                      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3">
                        <span className="text-[10px] text-blue-400 uppercase font-semibold block mb-1">
                          Chỉ số đo lường
                        </span>
                        <span className="text-sm font-semibold text-blue-900">
                          {item.successMetric}
                        </span>
                      </div>
                    )}
                    {item.targetValue && (
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
                        <span className="text-[10px] text-emerald-400 uppercase font-semibold block mb-1">
                          Mục tiêu
                        </span>
                        <span className="text-sm font-semibold text-emerald-900">
                          {item.targetValue}
                        </span>
                      </div>
                    )}
                    {item.measureFormula && (
                      <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-3">
                        <span className="text-[10px] text-purple-400 uppercase font-semibold block mb-1">
                          Công thức đo
                        </span>
                        <span className="text-sm font-semibold text-purple-900">
                          {item.measureFormula}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {item.notes && (
                  <div className="mb-6 bg-amber-50/50 border border-amber-100 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <FileText size={12} className="text-amber-500" />
                      <span className="text-[10px] text-amber-500 uppercase font-semibold">Ghi chú</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{item.notes}</p>
                  </div>
                )}

                {/* Corporate KR Linkage */}
                {item.corporateKRLinkage && (
                  <div className="mb-6 bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Target size={12} className="text-indigo-500" />
                      <span className="text-[10px] text-indigo-500 uppercase font-semibold">
                        Liên kết KR Corporate
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{item.corporateKRLinkage}</p>
                  </div>
                )}

                {/* Nested items */}
                {item.children && item.children.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Nested items ({item.children.length})
                      </h4>
                      {isAdmin && NEXT_TYPE[item.type] && (
                        <button
                          onClick={() => handleAddChild(item.id, item.type)}
                          className="p-1 rounded-md hover:bg-gray-100 text-blue-500 transition-colors cursor-pointer"
                          title="Thêm mục con"
                        >
                          <Plus size={16} />
                        </button>
                      )}
                    </div>
                    <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
                      {item.children.map((child: OkrItem) => {
                        const dotColor = STATUS_DOT[child.status] || 'bg-gray-300';
                        const childTypeStyle = TYPE_STYLES[child.type] || {
                          bg: 'bg-gray-500',
                          text: 'text-white',
                        };
                        const childStatusStyle = STATUS_STYLES[child.status] || STATUS_STYLES['Chưa bắt đầu'];

                        return (
                          <button
                            key={child.id}
                            onClick={() => navigateToChild(child.id)}
                            className="w-full flex items-center gap-3 py-3.5 px-4 hover:bg-blue-50/40 transition-colors text-left cursor-pointer group"
                          >
                            {/* Status dot */}
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />

                            {/* Type badge */}
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${childTypeStyle.bg} ${childTypeStyle.text}`}
                            >
                              {child.type === 'UserCapability'
                                ? 'UC'
                                : child.type === 'SuccessFactor'
                                  ? 'SF'
                                  : child.type.substring(0, 3).toUpperCase()}
                            </span>

                            {/* Code + Title */}
                            <span className="flex-1 min-w-0 text-sm text-gray-700 truncate group-hover:text-blue-700">
                              {child.code && (
                                <span className="font-semibold text-gray-500 mr-1.5">
                                  {child.code}
                                </span>
                              )}
                              {child.title}
                            </span>

                            {/* Status badge */}
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${childStatusStyle.bg} ${childStatusStyle.text}`}
                            >
                              {childStatusStyle.label}
                            </span>

                            {/* Progress */}
                            <span
                              className={`text-xs font-bold shrink-0 w-10 text-right ${getProgressColor(child.progressPct)}`}
                            >
                              {Math.round(child.progressPct)}%
                            </span>

                            <ChevronRight
                              size={14}
                              className="text-gray-300 group-hover:text-blue-400 shrink-0"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* No children */}
                {item.children && item.children.length === 0 && (
                  <div className="text-center py-8 px-4 border border-dashed border-gray-200 rounded-xl">
                    <p className="text-sm text-gray-400 mb-4">Không có mục con</p>
                    {isAdmin && NEXT_TYPE[item.type] && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => handleAddChild(item.id, item.type)}
                      >
                        <Plus className="mr-1.5 h-3 w-3" />
                        Thêm mục con
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Metadata sidebar */}
              <div className="w-60 shrink-0 border-l border-gray-100 p-5 bg-gray-50/30 space-y-5 overflow-y-auto">
                {/* Status */}
                {statusStyle && (
                  <div className="space-y-2">
                    {isAdmin ? (
                      <button
                        disabled={statusUpdating}
                        title="Nhấn để đổi trạng thái"
                        onClick={async () => {
                          if (!item) return;
                          setStatusUpdating(true);
                          try {
                            await fetch(`/api/items/${item.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: nextStatus(item.status) }),
                            });
                            await fetchItem(item.id);
                          } finally {
                            setStatusUpdating(false);
                          }
                        }}
                        className={`inline-flex text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap cursor-pointer hover:brightness-95 transition-all disabled:opacity-60 ${statusStyle.bg} ${statusStyle.text}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${statusStyle.dot} mr-2 mt-0.5`} />
                        {statusStyle.label}
                      </button>
                    ) : (
                      <span className={`inline-flex text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${statusStyle.bg} ${statusStyle.text}`}>
                        <span className={`w-2 h-2 rounded-full ${statusStyle.dot} mr-2 mt-0.5`} />
                        {statusStyle.label}
                      </span>
                    )}
                  </div>
                )}

                {/* Progress */}
                <div className="pb-4 border-b border-gray-100">
                  <span
                    className={`text-4xl font-bold tracking-tight ${getProgressColor(item.progressPct)}`}
                  >
                    {Math.round(item.progressPct)}
                  </span>
                  <span className={`text-lg ${getProgressColor(item.progressPct)}`}>%</span>
                </div>

                {/* Type */}
                {typeStyle && (
                  <div className="flex items-center gap-2.5">
                    <Tag size={14} className="text-gray-400 shrink-0" />
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${typeStyle.bg} ${typeStyle.text}`}
                    >
                      {TYPE_LABELS[item.type] || item.type}
                    </span>
                  </div>
                )}

                {/* Owner */}
                <div className="flex items-start gap-2.5">
                  <User size={14} className="text-gray-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block mb-0.5">Owner</span>
                    {isAdmin ? (
                      editingOwner ? (
                        <input
                          autoFocus
                          className="w-full text-sm border border-blue-300 rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-blue-400"
                          value={ownerDraft}
                          onChange={(e) => setOwnerDraft(e.target.value)}
                          onBlur={async () => {
                            setEditingOwner(false);
                            const newOwner = ownerDraft.trim() || null;
                            if (newOwner === (item.owner ?? null)) return;
                            await fetch(`/api/items/${item.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ owner: newOwner }),
                            });
                            await fetchItem(item.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                            if (e.key === 'Escape') { setEditingOwner(false); setOwnerDraft(item.owner || ''); }
                          }}
                          placeholder="Nhập tên owner..."
                        />
                      ) : (
                        <button
                          onClick={() => { setOwnerDraft(item.owner || ''); setEditingOwner(true); }}
                          className="text-sm text-gray-800 font-medium hover:text-blue-600 hover:underline text-left w-full truncate"
                          title="Nhấn để chỉnh sửa owner"
                        >
                          {item.owner || <span className="text-gray-400 italic">Chưa có owner</span>}
                        </button>
                      )
                    ) : (
                      <span className="text-sm text-gray-800 font-medium truncate block">
                        {item.owner || <span className="text-gray-400 italic">Chưa có owner</span>}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stakeholder */}
                {item.stakeholder && (
                  <div className="flex items-center gap-2.5">
                    <Users size={14} className="text-gray-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Stakeholder</span>
                      <span className="text-sm text-gray-700">{item.stakeholder}</span>
                    </div>
                  </div>
                )}

                {/* Project */}
                {item.project && (
                  <div className="flex items-center gap-2.5">
                    <Briefcase size={14} className="text-gray-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Dự án</span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded inline-block mt-0.5 ${
                          PROJECT_COLORS[item.project]?.bg || 'bg-gray-100'
                        } ${PROJECT_COLORS[item.project]?.text || 'text-gray-600'}`}
                      >
                        {item.project}
                      </span>
                    </div>
                  </div>
                )}

                {/* Dates */}
                {(() => {
                  const overdue = isOverdue(item.endDate, item.status);
                  const hasDate = item.startDate || item.endDate;
                  if (!hasDate && !isAdmin) return null;
                  return (
                    <div className="flex items-start gap-2.5">
                      <Calendar size={14} className={`mt-0.5 shrink-0 ${overdue ? 'text-red-500' : 'text-gray-400'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] text-gray-400 uppercase font-semibold">Thời gian</span>
                          {overdue && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600">Trễ hạn</span>
                          )}
                        </div>
                        {isAdmin ? (
                          editingDates ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-gray-400 w-10 shrink-0">Bắt đầu</span>
                                <input
                                  type="date"
                                  value={startDateDraft}
                                  onChange={e => setStartDateDraft(e.target.value)}
                                  className="flex-1 text-xs border border-blue-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-400"
                                />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-gray-400 w-10 shrink-0">Kết thúc</span>
                                <input
                                  type="date"
                                  value={endDateDraft}
                                  onChange={e => setEndDateDraft(e.target.value)}
                                  className="flex-1 text-xs border border-blue-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-400"
                                />
                              </div>
                              <div className="flex gap-2 pt-0.5">
                                <button
                                  onClick={async () => {
                                    setEditingDates(false);
                                    await fetch(`/api/items/${item.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        startDate: startDateDraft || null,
                                        endDate: endDateDraft || null,
                                      }),
                                    });
                                    await fetchItem(item.id);
                                  }}
                                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                >
                                  Lưu
                                </button>
                                <button
                                  onClick={() => setEditingDates(false)}
                                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                >
                                  Huỷ
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                const toInputDate = (d: string | Date | null | undefined) =>
                                  d ? new Date(d).toISOString().split('T')[0] : '';
                                setStartDateDraft(toInputDate(item.startDate));
                                setEndDateDraft(toInputDate(item.endDate));
                                setEditingDates(true);
                              }}
                              className="text-sm text-gray-700 hover:text-blue-600 hover:underline text-left"
                              title="Nhấn để chỉnh sửa thời gian"
                            >
                              {hasDate ? (
                                <>
                                  {item.startDate && <span>{new Date(item.startDate).toLocaleDateString('vi-VN')}</span>}
                                  {item.startDate && item.endDate && <span className="text-gray-300 mx-1">→</span>}
                                  {item.endDate && (
                                    <span className={overdue ? 'text-red-600 font-semibold' : ''}>
                                      {new Date(item.endDate).toLocaleDateString('vi-VN')}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-gray-400 italic">Chưa có thời gian</span>
                              )}
                            </button>
                          )
                        ) : (
                          <div className="text-sm">
                            {item.startDate && <span className="text-gray-700">{new Date(item.startDate).toLocaleDateString('vi-VN')}</span>}
                            {item.startDate && item.endDate && <span className="text-gray-300 mx-1">→</span>}
                            {item.endDate && (
                              <span className={overdue ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                                {new Date(item.endDate).toLocaleDateString('vi-VN')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Strategic Pillar */}
                {item.strategicPillar && (
                  <div className="flex items-start gap-2.5">
                    <Layers size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Trụ cột</span>
                      <span className="text-sm text-gray-700">{item.strategicPillar}</span>
                    </div>
                  </div>
                )}

                {/* Scope */}
                {item.scope && (
                  <div className="flex items-start gap-2.5">
                    <Flag size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Phạm vi</span>
                      <span className="text-sm text-gray-700">{item.scope}</span>
                    </div>
                  </div>
                )}

                {/* Deadline */}
                {item.deadline && (
                  <div className="flex items-start gap-2.5">
                    <Calendar size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Deadline</span>
                      <span className="text-sm text-gray-700">{item.deadline}</span>
                    </div>
                  </div>
                )}

                {/* PIC */}
                {item.pic && (
                  <div className="flex items-start gap-2.5">
                    <User size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">PIC</span>
                      <span className="text-sm text-gray-700">{item.pic}</span>
                    </div>
                  </div>
                )}

                {/* Chot Flag */}
                {item.chotFlag && (
                  <div className="text-xs text-gray-500 border-t border-gray-100 pt-4">
                    <span className="font-semibold text-gray-400 block mb-1">Chốt</span>
                    {item.chotFlag}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Không tìm thấy dữ liệu
          </div>
        )}
      </SheetContent>
    </Sheet>

    {/* Internal create-child drawer — works without onAddChild prop */}
    <CreateItemDrawer
      open={createOpen}
      onOpenChange={setCreateOpen}
      parentId={createParentId}
      parentType={createParentType}
      parentTitle={createParentTitle}
      initialType={createChildType}
      onCreated={handleChildCreated}
    />
    </>
  );
}
