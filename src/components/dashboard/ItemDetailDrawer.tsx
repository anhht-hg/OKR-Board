'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
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
  Target,
  Plus,
  Pencil,
  X,
  Check,
  GitBranch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TYPE_COLORS as TYPE_COLORS_RAW, TYPE_LABELS, PROJECTS, STATUSES } from '@/lib/constants';
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
  progressPct: number;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  'Chưa bắt đầu': { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', label: 'Chưa bắt đầu' },
  'Đang triển khai': { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-400', label: 'Đang triển khai' },
  'Hoàn thành': { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Hoàn thành' },
};

const TYPE_STYLES: Record<string, { bg: string; text: string }> = Object.fromEntries(
  Object.entries(TYPE_COLORS_RAW).map(([k, v]) => {
    const [bg, text] = v.split(' ');
    return [k, { bg, text }];
  })
);

const ALL_TYPES = ['Objective', 'SuccessFactor', 'KeyResult', 'Feature', 'UserCapability', 'Adoption', 'Impact'];

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
  if (pct > 100) return 'text-violet-600';
  if (pct >= 70) return 'text-emerald-500';
  if (pct >= 30) return 'text-orange-500';
  return 'text-rose-500';
}

function getProgressBarColor(pct: number) {
  if (pct > 100) return 'bg-gradient-to-r from-violet-500 to-amber-400';
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

// What type must a parent be for each type
const PARENT_TYPE: Record<string, string> = {
  SuccessFactor: 'Objective',
  KeyResult: 'SuccessFactor',
  Feature: 'KeyResult',
  UserCapability: 'Feature',
  Adoption: 'Feature',
  Impact: 'Feature',
};

// Double-click to edit field
function InlineField({
  label,
  value,
  onSave,
  multiline = false,
  placeholder = '',
  className = '',
  textClassName = 'text-sm text-gray-800',
}: {
  label: string;
  value: string;
  onSave: (val: string) => Promise<void>;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  textClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  // Keep draft in sync when item reloads
  useEffect(() => { setDraft(value); }, [value]);

  async function save() {
    setSaving(true);
    await onSave(draft.trim());
    setSaving(false);
    setEditing(false);
  }

  function cancel() { setDraft(value); setEditing(false); }

  if (editing) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        {label && <span className="text-[10px] text-gray-400 uppercase font-semibold">{label}</span>}
        {multiline ? (
          <textarea
            autoFocus
            rows={3}
            className="w-full text-sm border border-blue-400 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 resize-none bg-white"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={placeholder}
            onKeyDown={e => { if (e.key === 'Escape') cancel(); }}
          />
        ) : (
          <input
            autoFocus
            className="w-full text-sm border border-blue-400 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 bg-white"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={placeholder}
            onKeyDown={e => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') cancel();
            }}
          />
        )}
        <div className="flex gap-1.5">
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60">
            <Check size={11} /> Lưu
          </button>
          <button onClick={cancel}
            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
            <X size={11} /> Huỷ
          </button>
        </div>
      </div>
    );
  }

  // View mode — double click to edit
  return (
    <div
      className={`group cursor-text ${className}`}
      onDoubleClick={() => { setDraft(value); setEditing(true); }}
      title="Double-click để chỉnh sửa"
    >
      {label && (
        <span className="text-[10px] text-gray-400 uppercase font-semibold flex items-center gap-1 select-none">
          {label}
          <Pencil size={9} className="opacity-0 group-hover:opacity-40 transition-opacity" />
        </span>
      )}
      {value ? (
        <span className={`leading-relaxed block mt-0.5 whitespace-pre-wrap ${textClassName}`}>{value}</span>
      ) : (
        <span className="text-sm text-gray-300 italic block mt-0.5">
          {placeholder || (label ? `Chưa có ${label.toLowerCase()}` : '...')}
        </span>
      )}
    </div>
  );
}

// Compact badge-style code editor — click to edit, stays inline
function CodeBadgeEditor({
  code,
  typeStyle,
  isAdmin,
  onSave,
}: {
  code: string;
  typeStyle: { bg: string; text: string } | null;
  isAdmin: boolean;
  onSave: (val: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(code);

  useEffect(() => { setDraft(code); }, [code]);

  async function save() {
    await onSave(draft.trim());
    setEditing(false);
  }

  if (!isAdmin) {
    return code && typeStyle ? (
      <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-md ${typeStyle.bg} ${typeStyle.text}`}>
        {code}
      </span>
    ) : null;
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') { setDraft(code); setEditing(false); }
          }}
          className={`text-xs font-bold px-2.5 py-1 rounded-md outline-none border-2 border-blue-400 w-28 ${typeStyle?.bg} ${typeStyle?.text}`}
          placeholder="Mã code..."
        />
        <button onClick={save} className="text-[10px] font-semibold px-2 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors">
          <Check size={10} />
        </button>
        <button onClick={() => { setDraft(code); setEditing(false); }} className="text-[10px] font-semibold px-2 py-1 rounded-md bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
          <X size={10} />
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => { setDraft(code); setEditing(true); }}
      title="Click để sửa mã code"
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md transition-opacity hover:opacity-75 cursor-pointer ${
        typeStyle ? `${typeStyle.bg} ${typeStyle.text}` : 'bg-gray-100 text-gray-400'
      }`}
    >
      {code || <span className="font-normal italic opacity-60">+ Mã code</span>}
      <Pencil size={9} className="opacity-50" />
    </button>
  );
}

function ChangeParentField({
  item,
  onSave,
}: {
  item: OkrItem;
  onSave: (newParentId: string) => Promise<void>;
}) {
  const requiredParentType = PARENT_TYPE[item.type];
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');
  const [candidates, setCandidates] = useState<{ id: string; code: string | null; title: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!expanded || !requiredParentType) return;
    setLoading(true);
    setError(null);
    fetch(`/api/items?type=${encodeURIComponent(requiredParentType)}`)
      .then(r => r.json())
      .then(data => setCandidates(data.filter((c: { id: string }) => c.id !== item.id)))
      .finally(() => setLoading(false));
  }, [expanded, requiredParentType, item.id]);

  if (!requiredParentType) return null;

  const filtered = candidates.filter(c =>
    `${c.code ?? ''} ${c.title}`.toLowerCase().includes(search.toLowerCase())
  );

  async function select(newParentId: string) {
    setSaving(true);
    setError(null);
    try {
      await onSave(newParentId);
      setExpanded(false);
      setSearch('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cập nhật thất bại.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2 pb-2 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <GitBranch size={13} className="text-gray-400" />
          <span className="text-[10px] text-gray-400 uppercase font-semibold">Chuyển parent</span>
        </div>
        <button
          onClick={() => { setExpanded(v => !v); setSearch(''); }}
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
            expanded
              ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          }`}
        >
          {expanded ? 'Đóng' : 'Chọn'}
        </button>
      </div>

      {expanded && (
        <div className="space-y-1.5">
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Tìm ${TYPE_LABELS[requiredParentType]}...`}
            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-white"
          />
          <div className="rounded-lg border border-gray-100 overflow-hidden divide-y divide-gray-50 max-h-48 overflow-y-auto">
            {loading ? (
              <div className="text-xs text-gray-400 py-3 text-center">Đang tải...</div>
            ) : filtered.length === 0 ? (
              <div className="text-xs text-gray-400 py-3 text-center">Không có kết quả</div>
            ) : (
              filtered.map(c => (
                <button
                  key={c.id}
                  disabled={saving}
                  onClick={() => select(c.id)}
                  className="w-full text-left px-3 py-2.5 text-xs hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-start gap-2 disabled:opacity-50 cursor-pointer group"
                >
                  {c.code && (
                    <span className="font-bold text-gray-400 shrink-0 mt-px group-hover:text-blue-500">{c.code}</span>
                  )}
                  <span className="text-gray-700 leading-tight group-hover:text-blue-700">{c.title}</span>
                </button>
              ))
            )}
          </div>
          {error && (
            <p className="text-[11px] text-red-600 font-medium px-1">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function ItemDetailDrawer({ itemId, open, onOpenChange, onAddChild }: Props) {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [item, setItem] = useState<OkrItem | null>(null);
  const [ancestors, setAncestors] = useState<Ancestor[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [editingDates, setEditingDates] = useState(false);
  const [startDateDraft, setStartDateDraft] = useState('');
  const [endDateDraft, setEndDateDraft] = useState('');

  const [typeError, setTypeError] = useState<string | null>(null);

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
      if (!itemRes.ok) {
        console.error('Failed to load item:', itemRes.status);
        setItem(null);
        setAncestors([]);
        return;
      }
      const itemData = await itemRes.json();
      const ancestorData = ancestorRes.ok ? await ancestorRes.json() : [];
      setItem(itemData);
      setAncestors(ancestorData);
    } catch (err) {
      console.error('Failed to load item:', err);
      setItem(null);
      setAncestors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (itemId && open) {
      fetchItem(itemId);
      setHistory([]);
      setEditingDates(false);
    }
  }, [itemId, open, fetchItem]);

  async function patch(fields: Record<string, unknown>): Promise<void> {
    if (!item) return;
    const res = await fetch(`/api/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || 'Cập nhật thất bại.');
    }
    await fetchItem(item.id);
    queryClient.invalidateQueries({ queryKey: ['objectives'] });
  }

  function navigateToChild(childId: string) {
    if (item) setHistory(prev => [...prev, item.id]);
    fetchItem(childId);
  }

  function navigateBack() {
    const prev = history[history.length - 1];
    if (prev) { setHistory(h => h.slice(0, -1)); fetchItem(prev); }
  }

  function navigateToBreadcrumb(ancestorId: string) {
    if (item && ancestorId === item.id) return;
    setHistory([]);
    fetchItem(ancestorId);
  }

  function handleAddChild(parentId: string, parentType: string) {
    if (onAddChild) { onAddChild(parentId, parentType); return; }
    const nextType = NEXT_TYPE[parentType];
    if (!nextType) return;
    setCreateParentId(parentId);
    setCreateParentType(parentType);
    setCreateParentTitle(item ? (item.code ? `${item.code} · ${item.title}` : item.title) : null);
    setCreateChildType(nextType);
    setCreateOpen(true);
  }

  function handleChildCreated() {
    if (item) fetchItem(item.id);
    queryClient.invalidateQueries({ queryKey: ['objectives'] });
  }

  const statusStyle = item ? STATUS_STYLES[item.status] || STATUS_STYLES['Chưa bắt đầu'] : null;
  const typeStyle = item ? TYPE_STYLES[item.type] || { bg: 'bg-gray-500', text: 'text-white' } : null;

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        className="w-full sm:max-w-[42vw] p-0 overflow-y-auto border-l border-gray-200 shadow-2xl"
        side="right"
        onInteractOutside={e => e.preventDefault()}
      >
        <SheetTitle className="sr-only">{item ? item.title : 'Item detail'}</SheetTitle>

        {loading && !item ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : item ? (
          <div className="flex flex-col h-full">

            {/* Breadcrumb bar */}
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/60 flex items-center gap-2 min-h-[44px]">
              {history.length > 0 && (
                <button onClick={navigateBack} className="text-blue-500 hover:text-blue-700 text-xs font-medium mr-2 cursor-pointer shrink-0">
                  ← Quay lại
                </button>
              )}
              <div className="flex items-center gap-1 flex-wrap text-xs">
                {ancestors.map((anc, i) => {
                  const ancTypeStyle = TYPE_STYLES[anc.type] || { bg: 'bg-gray-500', text: 'text-white' };
                  const isCurrent = anc.id === item.id;
                  return (
                    <span key={anc.id} className="flex items-center gap-1">
                      {i > 0 && <ChevronRight size={10} className="text-gray-300 mx-0.5" />}
                      <button
                        onClick={() => navigateToBreadcrumb(anc.id)}
                        className={`transition-colors cursor-pointer flex items-center gap-1 ${isCurrent ? 'text-gray-800 font-semibold' : 'text-gray-400 hover:text-blue-600 hover:underline'}`}
                      >
                        <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${ancTypeStyle.bg} ${ancTypeStyle.text}`}>
                          {anc.type === 'SuccessFactor' ? 'SF' : anc.type.substring(0, 3).toUpperCase()}
                        </span>
                        {anc.code ? `${anc.code} · ${anc.title.substring(0, 20)}` : anc.title.substring(0, 30)}
                        {!isCurrent && (
                          <span className={`text-[9px] font-bold ml-0.5 ${anc.progressPct > 100 ? 'text-violet-500' : anc.progressPct >= 70 ? 'text-emerald-500' : 'text-orange-400'}`}>
                            {Math.round(anc.progressPct)}%
                          </span>
                        )}
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Main content + sidebar */}
            <div className="flex flex-1 min-h-0">

              {/* ── Left: main content ── */}
              <div className="flex-1 min-w-0 p-6 overflow-y-auto space-y-5">
                <SheetHeader className="mb-0">

                  {/* Code + Type */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <CodeBadgeEditor
                      code={item.code || ''}
                      typeStyle={typeStyle}
                      isAdmin={isAdmin}
                      onSave={val => patch({ code: val || null })}
                    />
                    {isAdmin ? (
                      <select
                        value={item.type}
                        onChange={async e => {
                          setTypeError(null);
                          try {
                            await patch({ type: e.target.value });
                          } catch (err) {
                            setTypeError(err instanceof Error ? err.message : 'Đổi loại thất bại.');
                          }
                        }}
                        className={`text-xs font-bold px-2.5 py-1 rounded-md border-0 outline-none cursor-pointer ${typeStyle?.bg} ${typeStyle?.text}`}
                        title="Đổi loại"
                      >
                        {ALL_TYPES.map(t => (
                          <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
                        ))}
                      </select>
                    ) : typeStyle ? (
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${typeStyle.bg} ${typeStyle.text}`}>
                        {TYPE_LABELS[item.type] || item.type}
                      </span>
                    ) : null}
                  </div>
                  {typeError && (
                    <p className="text-xs text-red-600 font-medium mt-1">{typeError}</p>
                  )}

                  {/* Title — double-click to edit */}
                  {isAdmin ? (
                    <InlineField
                      label=""
                      value={item.title}
                      onSave={val => val ? patch({ title: val }) : Promise.resolve()}
                      multiline
                      placeholder="Tiêu đề..."
                      className="mt-1"
                      textClassName="text-xl font-bold text-gray-900"
                    />
                  ) : (
                    <SheetTitle className="text-xl font-bold text-gray-900 leading-snug mt-2">
                      {item.title}
                    </SheetTitle>
                  )}

                  {/* Description */}
                  {isAdmin ? (
                    <InlineField
                      label="Mô tả"
                      value={item.description || ''}
                      onSave={val => patch({ description: val || null })}
                      multiline
                      placeholder="Nhập mô tả..."
                    />
                  ) : (
                    item.description && (
                      <p className="text-sm text-gray-500 mt-2 leading-relaxed">{item.description}</p>
                    )
                  )}
                </SheetHeader>

                {/* Progress bar */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</h4>
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

                {/* Corporate KR Linkage */}
                {isAdmin ? (
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Target size={12} className="text-indigo-500" />
                    </div>
                    <InlineField label="Liên kết KR Corporate" value={item.corporateKRLinkage || ''} onSave={val => patch({ corporateKRLinkage: val || null })} placeholder="Nhập liên kết..." />
                  </div>
                ) : (
                  item.corporateKRLinkage && (
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Target size={12} className="text-indigo-500" />
                        <span className="text-[10px] text-indigo-500 uppercase font-semibold">Liên kết KR Corporate</span>
                      </div>
                      <p className="text-sm text-gray-700">{item.corporateKRLinkage}</p>
                    </div>
                  )
                )}

                {/* Children list */}
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
                        const childTypeStyle = TYPE_STYLES[child.type] || { bg: 'bg-gray-500', text: 'text-white' };
                        const childStatusStyle = STATUS_STYLES[child.status] || STATUS_STYLES['Chưa bắt đầu'];
                        return (
                          <button
                            key={child.id}
                            onClick={() => navigateToChild(child.id)}
                            className="w-full flex items-center gap-3 py-3.5 px-4 hover:bg-blue-50/40 transition-colors text-left cursor-pointer group"
                          >
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${childTypeStyle.bg} ${childTypeStyle.text}`}>
                              {child.type === 'UserCapability' ? 'UC' : child.type === 'SuccessFactor' ? 'SF' : child.type.substring(0, 3).toUpperCase()}
                            </span>
                            <span className="flex-1 min-w-0 text-sm text-gray-700 truncate group-hover:text-blue-700">
                              {child.code && <span className="font-semibold text-gray-500 mr-1.5">{child.code}</span>}
                              {child.title}
                            </span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${childStatusStyle.bg} ${childStatusStyle.text}`}>
                              {childStatusStyle.label}
                            </span>
                            <span className={`text-xs font-bold shrink-0 w-10 text-right ${getProgressColor(child.progressPct)}`}>
                              {Math.round(child.progressPct)}%
                            </span>
                            <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-400 shrink-0" />
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
                      <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => handleAddChild(item.id, item.type)}>
                        <Plus className="mr-1.5 h-3 w-3" /> Thêm mục con
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* ── Right: metadata sidebar ── */}
              <div className="w-60 shrink-0 border-l border-gray-100 p-5 bg-gray-50/30 space-y-5 overflow-y-auto">

                {/* Change Parent — shown at top so it's easy to find */}
                {isAdmin && PARENT_TYPE[item.type] && (
                  <ChangeParentField
                    item={item}
                    onSave={async (newParentId) => {
                      await patch({ parentId: newParentId });
                      queryClient.invalidateQueries({ queryKey: ['objectives'] });
                    }}
                  />
                )}

                {/* Status — double-click to change */}
                {statusStyle && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block select-none">Trạng thái</span>
                    {isAdmin ? (
                      <select
                        value={item.status}
                        disabled={statusUpdating}
                        onChange={async e => {
                          setStatusUpdating(true);
                          try {
                            await patch({ status: e.target.value });
                          } finally {
                            setStatusUpdating(false);
                          }
                        }}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 outline-none cursor-pointer disabled:opacity-60 ${statusStyle.bg} ${statusStyle.text}`}
                        title="Chọn trạng thái"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <span className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${statusStyle.bg} ${statusStyle.text}`}>
                        <span className={`w-2 h-2 rounded-full ${statusStyle.dot} mr-2`} />
                        {statusStyle.label}
                      </span>
                    )}
                  </div>
                )}

                {/* Progress */}
                <div className="pb-4 border-b border-gray-100">
                  <span className={`text-4xl font-bold tracking-tight ${getProgressColor(item.progressPct)}`}>
                    {Math.round(item.progressPct)}
                  </span>
                  <span className={`text-lg ${getProgressColor(item.progressPct)}`}>%</span>
                </div>

                {/* Owner */}
                <div className="flex items-start gap-2.5">
                  <User size={14} className="text-gray-400 shrink-0 mt-4" />
                  <div className="flex-1 min-w-0">
                    {isAdmin ? (
                      <InlineField
                        label="Owner"
                        value={item.owner || ''}
                        onSave={val => patch({ owner: val || null })}
                        placeholder="Nhập tên owner..."
                      />
                    ) : (
                      <>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold block mb-0.5">Owner</span>
                        <span className="text-sm text-gray-800 font-medium truncate block">
                          {item.owner || <span className="text-gray-400 italic">Chưa có owner</span>}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Stakeholder */}
                <div className="flex items-start gap-2.5">
                  <Users size={14} className="text-gray-400 shrink-0 mt-4" />
                  <div className="flex-1 min-w-0">
                    {isAdmin ? (
                      <InlineField
                        label="Stakeholder"
                        value={item.stakeholder || ''}
                        onSave={val => patch({ stakeholder: val || null })}
                        placeholder="Nhập stakeholder..."
                      />
                    ) : (
                      item.stakeholder && (
                        <>
                          <span className="text-[10px] text-gray-400 uppercase font-semibold block">Stakeholder</span>
                          <span className="text-sm text-gray-700">{item.stakeholder}</span>
                        </>
                      )
                    )}
                  </div>
                </div>

                {/* Project */}
                <div className="flex items-start gap-2.5">
                  <Briefcase size={14} className="text-gray-400 shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block mb-0.5">Dự án</span>
                    {isAdmin ? (
                      <select
                        value={item.project || ''}
                        onChange={async e => await patch({ project: e.target.value || null })}
                        className={`text-xs font-semibold px-2 py-0.5 rounded border-0 outline-none cursor-pointer ${
                          item.project
                            ? `${PROJECT_COLORS[item.project]?.bg || 'bg-gray-100'} ${PROJECT_COLORS[item.project]?.text || 'text-gray-600'}`
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        <option value="">-- Không có --</option>
                        {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    ) : (
                      item.project && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded inline-block ${PROJECT_COLORS[item.project]?.bg || 'bg-gray-100'} ${PROJECT_COLORS[item.project]?.text || 'text-gray-600'}`}>
                          {item.project}
                        </span>
                      )
                    )}
                  </div>
                </div>

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
                          {overdue && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600">Trễ hạn</span>}
                        </div>
                        {isAdmin ? (
                          editingDates ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-gray-400 w-10 shrink-0">Bắt đầu</span>
                                <input type="date" value={startDateDraft} onChange={e => setStartDateDraft(e.target.value)} className="flex-1 text-xs border border-blue-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-400" />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-gray-400 w-10 shrink-0">Kết thúc</span>
                                <input type="date" value={endDateDraft} onChange={e => setEndDateDraft(e.target.value)} className="flex-1 text-xs border border-blue-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-400" />
                              </div>
                              <div className="flex gap-2 pt-0.5">
                                <button
                                  onClick={async () => { setEditingDates(false); await patch({ startDate: startDateDraft || null, endDate: endDateDraft || null }); }}
                                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                >Lưu</button>
                                <button onClick={() => setEditingDates(false)} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">Huỷ</button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                const toInput = (d: string | Date | null | undefined) => d ? new Date(d).toISOString().split('T')[0] : '';
                                setStartDateDraft(toInput(item.startDate));
                                setEndDateDraft(toInput(item.endDate));
                                setEditingDates(true);
                              }}
                              className="text-sm text-gray-700 hover:text-blue-600 hover:underline text-left"
                            >
                              {hasDate ? (
                                <>
                                  {item.startDate && <span>{new Date(item.startDate).toLocaleDateString('vi-VN')}</span>}
                                  {item.startDate && item.endDate && <span className="text-gray-300 mx-1">→</span>}
                                  {item.endDate && <span className={overdue ? 'text-red-600 font-semibold' : ''}>{new Date(item.endDate).toLocaleDateString('vi-VN')}</span>}
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
                            {item.endDate && <span className={overdue ? 'text-red-600 font-semibold' : 'text-gray-700'}>{new Date(item.endDate).toLocaleDateString('vi-VN')}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Strategic Pillar */}
                {(isAdmin || item.strategicPillar) && (
                  <div className="flex items-start gap-2.5">
                    <Layers size={14} className="text-gray-400 mt-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      {isAdmin ? (
                        <InlineField label="Trụ cột" value={item.strategicPillar || ''} onSave={val => patch({ strategicPillar: val || null })} placeholder="Nhập trụ cột..." />
                      ) : (
                        <>
                          <span className="text-[10px] text-gray-400 uppercase font-semibold block">Trụ cột</span>
                          <span className="text-sm text-gray-700">{item.strategicPillar}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Scope */}
                {(isAdmin || item.scope) && (
                  <div className="flex items-start gap-2.5">
                    <Flag size={14} className="text-gray-400 mt-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      {isAdmin ? (
                        <InlineField label="Phạm vi" value={item.scope || ''} onSave={val => patch({ scope: val || null })} placeholder="Nhập phạm vi..." />
                      ) : (
                        <>
                          <span className="text-[10px] text-gray-400 uppercase font-semibold block">Phạm vi</span>
                          <span className="text-sm text-gray-700">{item.scope}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* PIC */}
                {(isAdmin || item.pic) && (
                  <div className="flex items-start gap-2.5">
                    <User size={14} className="text-gray-400 mt-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      {isAdmin ? (
                        <InlineField label="PIC" value={item.pic || ''} onSave={val => patch({ pic: val || null })} placeholder="Nhập PIC..." />
                      ) : (
                        <>
                          <span className="text-[10px] text-gray-400 uppercase font-semibold block">PIC</span>
                          <span className="text-sm text-gray-700">{item.pic}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Deadline */}
                {(isAdmin || item.deadline) && (
                  <div className="flex items-start gap-2.5">
                    <Calendar size={14} className="text-gray-400 mt-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      {isAdmin ? (
                        <InlineField label="Deadline" value={item.deadline || ''} onSave={val => patch({ deadline: val || null })} placeholder="Nhập deadline..." />
                      ) : (
                        <>
                          <span className="text-[10px] text-gray-400 uppercase font-semibold block">Deadline</span>
                          <span className="text-sm text-gray-700">{item.deadline}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Chốt với C-Level */}
                {(item.chotFlag || isAdmin) && (
                  <div className="border-t border-gray-100 pt-4">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Chốt với C-Level</span>
                    {isAdmin ? (
                      <button
                        onClick={async () => {
                          const next = item.chotFlag === 'TRUE' ? 'FALSE' : 'TRUE';
                          await patch({ chotFlag: next });
                        }}
                        className={`text-xs font-bold px-3 py-1 rounded-full transition-colors cursor-pointer ${
                          item.chotFlag === 'TRUE'
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {item.chotFlag === 'TRUE' ? '✓ Đã chốt — Tính vào mục tiêu' : '✗ Chưa chốt — Bonus vượt mục tiêu'}
                      </button>
                    ) : (
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        item.chotFlag === 'TRUE'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {item.chotFlag === 'TRUE' ? '✓ Đã chốt' : '✗ Chưa chốt'}
                      </span>
                    )}
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
